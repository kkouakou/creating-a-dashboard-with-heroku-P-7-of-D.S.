//=========================================
// File name: quizfaber.js
//-----------------------------------------
// Project : QuizFaber 
// Licence : MIT
// Author  : Luca Galli
// Email   : info@quizfaber.com
//=========================================

var fileSystem = require('fs');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });

var port = process.env.PORT || 3313;
var useSession = false;

const dbConfigFile = "db.conf";
const homePageFile = "home.html";
const anonymousLogin = "anonymous@anonymous.nowhere";

const { Login, Quiz, Result, ResultHeader, ResultItem, Abstract, SearchParams, RetakeInfo, SessionInfo } = require('./definitions');
const { GetQueryStringForCheckResult, GetQueryStringSelectPersor, GetQueryStringInsertPerson, GetQueryStringFromQuiz, GetQueryStringForInsertQuizResultReport, GetQueryStringForQuizResultReport, GetQueryStringForAllAnswers, GetQueryStringFromQuestion, GetQueryStringForQuizReport, GetQueryStringForQuestionReport, GetQueryStringForGetTitles, GetQueryStringForGetResultsAbstract, GetQueryStringForUpdateDateLastAccess, GetQueryStringForGetDbVersion, GetQueryStringForDbSize, GetQueryStringOpenSession, GetQueryStringUpdateDataSession, GetQueryStringCloseSession, GetQueryStringGetLastOpenedSession } = require('./queries');

const { Pool } = require('pg');
var pool;
var isDbConnected = false;

var qfDbVersion = 0;
var qfDbSize = 0;

var pjson = require('./package.json');

/// <summary>
/// Running server details.
/// </summary>
var server = app.listen(port, function ()
{
	var host = server.address().address;

	console.log("###############################################");
	console.log("#     QuizFaber project - Node.js server      #");
	console.log("###############################################");
	console.log("");
	console.log("Listening at host %s port %s", host, port);
	console.log("Node.js version : " + process.version);
	console.log("Package version : " + pjson.version);

	// read db config file and create a pool
	fileSystem.readFile(dbConfigFile, 'utf8', function (err, data)
	{
		if (err) {
			console.log('db config file not found!');
			console.error(err);
			throw err;
		}
		
		console.log('found db config file');

		var dbConfigData = JSON.parse(data);
		
		InitPostgreSQL(dbConfigData);	
	});	
});

/// <summary>
/// Database inizialization 
/// </summary>
function InitPostgreSQL(dbConfigData)
{
	console.log("connecting to db host : " + dbConfigData.dbHost + "..");

	// create connection pool
	pool = new Pool({
		user: dbConfigData.dbUser,
		host: dbConfigData.dbHost,
		database: dbConfigData.dbName,
		password: dbConfigData.dbPassword,
		port: dbConfigData.dbPort,
		ssl: { rejectUnauthorized: false },
		statement_timeout: 120000
	});

	useSession = dbConfigData.useSession;

	console.log("created connection pool for db : " + dbConfigData.dbName);

	// check connection and read table 'Settings'
	pool.connect()
		.then(client => {
			isDbConnected = true;
			return client.query(GetQueryStringForGetDbVersion())
				.then(res => {
					
					if (res.rows.length >= 1) {
						qfDbVersion = res.rows[0].dbversion;
						console.log("found QuizFaber DB version : " + qfDbVersion);

						client.query(GetQueryStringForDbSize(dbConfigData.dbName))
							.then((res) => {
								if (res.rows.length >= 1) {
									qfDbSize = res.rows[0].dbsize;
									console.log("found QuizFaber DB size : " + qfDbSize);
								}
								else {
									console.error("ERROR : unable to check QuizFaber DB size");
								}
								client.release();
							})
							.catch(err => {
								// select db size failed
								console.log('cannot check database size');
								console.error('ERROR : ' + err);
								client.release();
							})
					}
					else {
						client.release();
						console.error("ERROR : unable to find QuizFaber DB version");
					}
					
				})
				.catch(err => {
					// select failed
					client.release();
					console.log('cannot select from table Settings');
					console.error('ERROR : ' + err);
				})
		})
		.catch(err => {
			//not connected
			console.error('cannot connect to database : ' + err);
			throw err;
		});
}

/// <summary>
/// Getting the home page
/// </summary>
app.get('/', function (request, response) {
	console.log("GET index");
	SendHomeResponse(response);
});

/// <summary>
/// Returns the html of the home page
/// </summary>
function SendHomeResponse(res) {

	// read home page file
	fileSystem.readFile(homePageFile, 'utf8', function (err, data) {
		if (err) {
			console.log('WARNING : home page file not found!');
			var html = "<body><h1>QuizFaber Node.js server up and running</h1></body>";
			res.send(html);
		}
		else {
			console.log('found home page file');

			if (isDbConnected) {
				if (qfDbVersion > 0) {
					data = data.replace("{ERR_CONFIG}", "");
				}
				else {
					data = data.replace("{ERR_CONFIG}", "<div class='alert alert-warning'><b>Database is not configurated</b>. Popolate the database running the sql script <b>DB_QF_CreateTables.PostgreSQL.sql</b></div>");
				}
			}
			else {
				data = data.replace("{ERR_CONFIG}", "<div class='alert alert-danger'><b>Not connected to database</b>. Check database connection parameters into <b>db.conf</b> file</div>");
			}

			data = data.replace("{NODE_VERS}", process.version);
			data = data.replace("{PKG_VERS}", pjson.version);

			if (qfDbVersion > 0) {
				data = data.replace("{DB_VERS}", qfDbVersion);
			}
			else {
				data = data.replace("{DB_VERS}", "<span style='color:red'>Unknown</span>");
			}

			if (qfDbSize > 0) {
				data = data.replace("{DB_SIZE}", qfDbSize + " MBytes");
			}
			else {
				data = data.replace("{DB_SIZE}", "<span style='color:red'>Unknown</span>");
			}

			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(data);
			res.end();
		}
	});
}


/// <summary>
/// Bypass the CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
/// </summary>
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

/// <summary>
/// Store quiz results sent by QuizFaber client
/// </summary>
app.post('/results', urlencodedParser, (req, res) =>
{
	console.log('Storing quiz results');

	try
	{
		var quiz = JSON.parse(req.body.quiz);

		pool.connect()
			.then(conn => {
		//pool.query("START TRANSACTION")
			//.then(() => {

				var query = GetQueryStringFromQuiz(quiz);

				conn.query(query)
					.then( async (result) => {
						
						// get the assigned quiz id from autoincrement field
						var quizID = result.rows[0].id;

						console.log('insert quiz row done, quiz id = ' + quizID);
						console.log('num of questions to store =' + quiz.questions.length);

						var numQuestDone = 0;

						for (var i = 0; i < quiz.questions.length; i++) {
							var question = quiz.questions[i];

							query = GetQueryStringFromQuestion(quizID, i + 1, question);
							
							result = await conn.query(query);

							var questionID = result.rows[0].id;

							console.log('insert question row done, id=' + questionID);

							var queryAns = GetQueryStringForAllAnswers(question, questionID);
							await conn.query(queryAns);
					
							console.log('insert answers of question id=' + questionID + ' done');

							numQuestDone++;
							if (numQuestDone === quiz.questions.length) {

								console.log('all answers row inserted');

								console.log('insert report');
								var queryReport = GetQueryStringForInsertQuizResultReport(quizID, req.body.report);
								await conn.query(queryReport);

								if ((quiz.currentUser !== null) && (useSession))
								{
									if (quiz.currentUser.email !== anonymousLogin)
									{
										console.log('get id for user ' + quiz.currentUser.email);
										var queryUser = GetQueryStringSelectPersor(quiz.currentUser.email);
										var userResult = await conn.query(queryUser);
										var personID = userResult.rows[0].id;

										console.log('update session for ID=' + personID);
										var querySession = GetQueryStringCloseSession(personID, quiz.currentUser.sessionId, GetRemoteIp(req), quizID)
										await conn.query(querySession);
									}
								}

								// all done
								// conn.query("COMMIT").then(() => { conn.release(); });
								console.log('all done');
								conn.release();
								res.send('OK');
							}
						}
					})
					.catch(err => {
						HandleError(res, conn, 'error in inserting quiz row', err);
						//HandleErrorInTransaction(res, conn, 'error in inserting quiz row', err);
					});
			}).catch(err => {
				//not connected
				SendInternalServerError(res, 'not connected : ' + err);
			});
			//}).catch(err => {
				// start transaction failed
			//	console.log('transaction not started : ' + err);
			//	pool.end();
			//	SendInternalServerError(res);
			//});
	}
	catch (err)
	{
		SendInternalServerError(res, 'exception : ' + err);
	}
});

/// <summary>
/// New user registration   
/// </summary>
app.post('/registration', urlencodedParser, function (req, res) {

	console.log('User registration');

	try
	{
		var user = JSON.parse(req.body.login);

		pool.connect()
			.then(conn => {

				var query = GetQueryStringInsertPerson(user);
				conn.query(query)
					.then(() => {
						console.log('insert user done');
						conn.release(); 
						res.send('OK');
					})
					.catch(err => {
						HandleError(res, conn, 'error in inserting user', err);
					});
			}).catch(err => {
				//not connected
				SendInternalServerError(res, 'not connected : ' + err);
			});
	}
	catch (err)
	{
		SendInternalServerError(res, 'exception : ' + err);
	}
});

/// <summary>
/// User login   
/// </summary>
app.post('/login', urlencodedParser, function (req, res)
{
	console.log('Login : ' + req.body.login);

	try
	{
		pool.connect()
			.then(conn => {
				var query = GetQueryStringSelectPersor(req.body.login);
				conn.query(query)
					.then((result) => {
						
						var rows = result.rows;
						if (rows.length === 1)
						{
							if (rows[0].isenabled)
							{
								var user = new Login(rows[0].id, rows[0].personname, rows[0].useridentity, rows[0].userpassword);
								user.otherFields = JSON.parse(rows[0].info);

								if (user.password === req.body.pwd)
								{
									console.log("user found : " + user.email);

									// update last access date
									var query = GetQueryStringForUpdateDateLastAccess(user.id);
									conn.query(query)
										.then( async () =>
										{
											if (useSession) {
												console.log('create a new session');
												user.sessionId = CreateGuid();
												var remoteIp = GetRemoteIp(req);
												var querySession = GetQueryStringOpenSession(user.id, user.sessionId, remoteIp, 0);
												await conn.query(querySession);
											}
											else {
												console.log('without session');
											}

											var jsonUser = JSON.stringify(user);

											res.set("Connection", "close");
											res.send(jsonUser);
											conn.release();
											console.log("user logged in");
										})
										.catch(err => {
											// update failed
											SendInternalServerError(res, 'update last date access failed : ' + err);
											conn.release();
										});
								}
								else
								{
									SendUnauthorized(res, "wrong password for user " + req.body.login);
									conn.release();
								}
							}
							else
							{
								SendUnauthorized(res, "user not enabled : " + req.body.login);
								conn.release();
							}
						}
						else
						{
							SendNotFound(res, "user not found : " + req.body.login);
							conn.release();
						}
					})
					.catch(err => {
						// select failed
						SendInternalServerError(res, 'select failed : ' + err);
						conn.release();
					})
			})
			.catch(err => {
				//not connected
				SendInternalServerError(res, 'not connected : ' + err);
			});
	}
	catch (err) {
		SendInternalServerError(res, 'exception : ' + err);
	}


});

/// <summary>
/// Verify if a user is already registered  
/// </summary>
app.get('/checklogin', urlencodedParser, function (req, res)
{
	console.log('Check login for : ' + req.query.login);

	try
	{
		pool.connect()
			.then(conn =>
			{
				var query = GetQueryStringSelectPersor(req.query.login);
				conn.query(query)
					.then((result) =>
					{
						var rows = result.rows;
						if (rows.length === 1)
						{
							console.log("user found : " + req.query.login);
							res.set("Connection", "close");
							res.send("OK");
						}
						else
						{
							SendNotFound(res, "user not found : " + req.query.login);
						}
						conn.release();							
					})
					.catch(err => {
						// select failed
						SendInternalServerError(res, 'select failed : ' + err);
						conn.release();
					})
			})
			.catch(err => {
				//not connected
				SendInternalServerError(res, 'not connected : ' + err);
			});
	}
	catch (err) {
		SendInternalServerError(res, 'exception : ' + err);
	}
});

/// <summary>
/// Verify if a user has already answered to a given quiz   
/// </summary>
app.get('/checkresult', urlencodedParser, function (req, res) {

	console.log('Check quiz result ' + req.query.name + ' for user : ' + req.query.login);

	try
	{
		pool.connect()
			.then(conn =>
			{
				var query = GetQueryStringForCheckResult(req.query.name, req.query.login);
				conn.query(query)
					.then((result) => {
						var rows = result.rows;
						
						if (rows.length === 1)
						{
							console.log("quiz result " + req.query.name + " found for user : " + req.query.login);

							var retakeInfo = new RetakeInfo(rows[0].numofretake, rows[0].finalmark);
							var jsonRetakeInfo = JSON.stringify(retakeInfo);

							res.set("Connection", "close");
							res.send(jsonRetakeInfo);
						}
						else
						{
							SendNotFound(res, "quiz result " + req.query.name + " not found for user : " + req.query.login);
						}
						conn.release();
					})
					.catch(err => {
						// select failed
						SendInternalServerError(res, 'select failed : ' + err);
						conn.release();
					})
			})
			.catch(err => {
				//not connected
				SendInternalServerError(res, 'not connected : ' + err);
			});
	}
	catch (err)
	{
		SendInternalServerError(res, 'exception : ' + err);
	}
});

/// <summary>
/// Get all the titles (and few other information) of the quizzes stored on database :
/// only the quizzes stored with all data, non only the results sent from users 
/// </summary>
app.get('/gettitles', urlencodedParser, function (req, res) {

	console.log('Get abstract titles');

	try {
		var quizzes = [];
		var quiz, name, title, date, id;

		pool.connect()
			.then(conn => {
				var query = GetQueryStringForGetTitles();
				conn.query(query)
					.then((result) => {
						
						var rows = result.rows;
						for (var i = 0; i < rows.length; i++)
						{
							id = rows[i].qz_id;
							name = rows[i].quizname;
							title = rows[i].title;
							date = rows[i].datemodified;
	
							quiz = new Quiz(id, name, title, date);
							quizzes.push(quiz);
						}

						var text = JSON.stringify(quizzes);
						res.set("Connection", "close");
						res.send(text);
						conn.release();

					}).catch(err => {
						// select failed
						SendInternalServerError(res, 'select failed : ' + err);
						conn.release();
					})
			}).catch(err => {
				//not connected
				SendInternalServerError(res, 'not connected : ' + err);
			});
	}
	catch (err) {
		SendInternalServerError('exception : ' + err);
	}
});

/// <summary>
/// Get all the titles (and few other information) of the quizzes for which there are results stored
/// </summary>
app.get('/getresultsabstract', urlencodedParser, function (req, res) {

	console.log('Get abstract results');

	try
	{
		var abstracts = [];
		var abstract, title, user, date, mark;

		pool.connect()
			.then(conn => {
				var query = GetQueryStringForGetResultsAbstract();
				conn.query(query)
					.then((result) => {
						
						var rows = result.rows;
						for (var i = 0; i < rows.length; i++)
						{
							title = rows[i].quizname + " - " + rows[i].quiztitle;
							user = rows[i].username + " - " + rows[i].userlogin;
							date = rows[i].datecompleted;
							mark = rows[i].finalmark;
							
							console.log('title=' + title);
							
							abstract = new Abstract(title, user, date, mark);
							abstracts.push(abstract);
						}

						var text = JSON.stringify(abstracts);
						res.set("Connection", "close");
						res.send(text);
						conn.release();

					}).catch(err => {
						// select failed
						SendInternalServerError(res, 'select failed : ' + err);
						conn.release();
					})
			}).catch (err => {
				//not connected
				SendInternalServerError(res, 'not connected : ' + err);
			});
	}
	catch (err)
	{
		SendInternalServerError(res, 'exception : ' + err);
	}
});

/// <summary>
/// Gets the quizzes results given some filters  
/// </summary>
app.get('/getresults', urlencodedParser, function (req, res) {

	console.log('Get quiz results');

	try {
		var results = [];

		var searchParams = new SearchParams(
			req.query.title,
			req.query.user,
			req.query.fromDate,
			req.query.toDate,
			req.query.fromMark,
			req.query.toMark,
			req.query.top);

		pool.connect()
			.then(conn => {
				var query = GetQueryStringForQuizReport(searchParams);

				conn.query(query)
					.then((result) => {
						
						var rows = result.rows;
						
						for (var i = 0; i < rows.length; i++)
						{
							result = new Result();
							result.Header = new ResultHeader();

							result.Id = rows[i].id;
							result.UserName = rows[i].username;
							result.UserLogin = rows[i].userlogin;
							result.DateCompleted = rows[i].datecompleted;
							result.ElapsedTime = rows[i].elapsedtime;
							result.HighestMark = rows[i].highestmark;
							result.NumCorrectAnswers = rows[i].rightquestsnum;
							result.NumWrongAnswers = rows[i].wrongquestsnum;
							result.NumNotValutated = rows[i].questsnum - rows[i].rightquestsnum - rows[i].wrongquestsnum;
							result.FinalMark = rows[i].finalmark;

							result.Header.Name = rows[i].quizname;
							result.Header.Title = rows[i].quiztitle;
							result.Header.Author = rows[i].author;
							result.Header.Argument = rows[i].argument;
							result.Header.Duration = rows[i].totaltime;
							result.Header.NumOfQuestions = rows[i].questsnum;

							results.push(result);
						}

						var text = JSON.stringify(results);
						res.set("Connection", "close");
						res.send(text);
						conn.release();

					}).catch(err => {
						// select failed
						SendInternalServerError(res, 'select failed : ' + err);
						conn.release();
					})
			}).catch(err => {
				//not connected
				SendInternalServerError(res, 'not connected : ' + err);
			});
	}
	catch (err)
	{
		SendInternalServerError(res, 'exception : ' + err);
	}

});

/// <summary>
/// Gets the questions of a quiz result, given its ID
/// </summary>
app.get('/getresultdetails', urlencodedParser, function (req, res) {

	console.log('Get quiz results details');

	try
	{
		var item;
		var items = [];

		var id = req.query.id;
		console.log('Search quiz results with ID=' + id);

		pool.connect()
			.then(conn => {
				var query = GetQueryStringForQuestionReport(id);

				conn.query(query)
					.then(async (result) => {

						console.log('found quiz results');
						
						var rows = result.rows;
						
						for (var i = 0; i < rows.length; i++)
						{
							item = new ResultItem();
							item.TypeOfQuest = rows[i].questtype;
							item.Weight = rows[i].weight;
							item.SelectedAnswers = (rows[i].questtype === 3) ? rows[i].additionaltexts : rows[i].choices;
							item.Response = rows[i].score + " [" + rows[i].minscore + " - " + rows[i].maxscore + "]"; 
							item.ShortTextQuestion = rows[i].shorttextquestion;
							item.Valid = rows[i].valid;

							items.push(item);
						}

						console.log('getting report..');

						var queryReport = GetQueryStringForQuizResultReport(id);
						var resultReport = await conn.query(queryReport);
						var report = '';
						if (resultReport.rowCount === 1) {
							console.log('found report');
							report = resultReport.rows[0].report;
						}

						var text = JSON.stringify({ Answers: items, Report: report});
						res.set("Connection", "close");
						res.send(text);
						conn.release();

					}).catch(err => {
						// query select failed
						SendInternalServerError(res, 'select failed : ' + err);
						conn.release();
					})
			}).catch(err => {
				//not connected
				SendInternalServerError(res, 'not connected : ' + err);
			});
	}
	catch (err)
	{
		SendInternalServerError(res, 'exception : ' + err);
	}
});

function HandleErrorInTransaction(res, conn, msg, err) {
	conn.query("ROLLBACK").then(() => { conn.release(); });
	SendInternalServerError(res, msg + ' : ' + err);
}

function HandleError(res, conn, msg, err) {
	conn.release();
	SendInternalServerError(res, msg + ' : ' + err);
}

function SendInternalServerError(res, msg) {
	console.error(msg);
	res.set("Connection", "close");
	res.status(500).send("internal server error");
}

function SendNotFound(res, msg) {
	console.error(msg);
	res.set("Connection", "close");
	res.status(404).send("not found");
}

function SendUnauthorized(res, msg) {
	console.error(msg);
	res.set("Connection", "close");
	res.status(401).send("unauthorized");
}

function CreateGuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function GetRemoteIp(req) {
	return (typeof req.headers['x-forwarded-for'] === 'string'
		&& req.headers['x-forwarded-for'].split(',').shift())
		|| req.connection.remoteAddress
		|| req.socket.remoteAddress
		|| req.connection.socket.remoteAddress
}






