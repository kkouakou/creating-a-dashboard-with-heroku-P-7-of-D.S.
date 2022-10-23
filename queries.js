//=========================================
// File name: queries.js
//-----------------------------------------
// Project : QuizFaber 
// Licence : MIT
// Author  : Luca Galli
// Email   : info@quizfaber.com
//=========================================

/// <summary>
/// SQL query for verify if a user has already answered to a given quiz
/// </summary>
GetQueryStringForCheckResult = (name,login) => {
	var query = "";

	query += " SELECT NumOfRetake,FinalMark  ";
	query += " FROM QuizResult WHERE QuizName='" + name + "' AND UserLogin='" + login + "'";
	query += " ORDER BY NumOfRetake DESC";
	query += " LIMIT 1";

	return query;
}

/// <summary>
/// SQL query for verify if a user is already registered
/// </summary>
GetQueryStringSelectPersor = (login) => {
	var query = "";

	query += "SELECT p.ID,PersonName,p.UserIdentity,p.UserPassword,p.UserRole,p.Info,p.IsEnabled,r.RoleName FROM Person p ";
	query += "INNER JOIN PersonRole r ON r.ID = p.UserRole ";
	query += "WHERE UserIdentity = '" + login + "'";

	return query;
}

/// <summary>
/// SQL query for new user registration
/// </summary>
GetQueryStringInsertPerson = (person) => {
	var listValue = "";

	listValue += "'" + EscapeSpecialChar(person.name) + "',"; 
	listValue += "'" + EscapeSpecialChar(person.email) + "',"; 
	listValue += "'" + EscapeSpecialChar(person.password) + "',"; 
	listValue += "2,";
	listValue += "'" + EscapeSpecialChar(JSON.stringify(person.otherFields)) + "',";
	listValue += "TRUE,";
	listValue += "NOW(),NOW()";

	return "INSERT INTO Person (PersonName,UserIdentity,UserPassword,UserRole,Info,IsEnabled,DateCreated,DateModified) VALUES (" + listValue + ")";
}

/// <summary>
/// SQL query for get the questions of a quiz result, given its ID
/// </summary>
GetQueryStringForQuestionReport = (id) => {
	var query = "";

	query += " SELECT ID, IdQuizResult,QuestNum,QuestType,Weight,ShortTextQuestion, Valid, q.Score, MaxScore, MinScore, string_agg(Choice,' ; ') AS Choices, string_agg(AdditionalText,'') AS AdditionalTexts ";
	query += " FROM QuizResultQuestion q";
	query += " INNER JOIN QuizResultAnswer a on a.IdResultQuestion = q.ID ";
	query += " WHERE IdQuizResult = " + id;
	query += " GROUP BY ID, IdQuizResult,QuestNum,QuestType,Weight,ShortTextQuestion, Valid, q.Score, MaxScore, MinScore"
	//query += " ORDER BY AnswerNum";

	return query;
}

/// <summary>
/// SQL query for get the quizzes results given some filters 
/// </summary>
GetQueryStringForQuizReport = (searchParams) => {

	var query = "";

	query += " SELECT qr.ID, qr.QuizName,qr.QuizTitle,qr.UserName,qr.UserLogin,qr.DateCompleted,qr.DateReceived,qr.QuestsNum,qr.HighestMark,qr.FinalMark,qr.TotalTime,qr.ElapsedTime,qr.RightQuestsNum,qr.WrongQuestsNum,q.Author,q.Argument ";
	query += " FROM QuizResult qr ";
	query += " LEFT JOIN Quizzes q ON q.QZ_ID=qr.QuizID ";

	query += " WHERE ";
	query += " (qr.QuizName LIKE '%" + searchParams.Title + "%' OR ";
	query += " qr.QuizTitle LIKE '%" + searchParams.Title + "%' OR ";
	query += " CONCAT(qr.QuizName,' - ',qr.QuizTitle) LIKE '%" + searchParams.Title + "%') AND ";

	query += " (qr.UserName LIKE '%" + searchParams.User + "%' OR ";
	query += " qr.UserLogin LIKE '%" + searchParams.User + "%' OR ";
	query += " CONCAT(qr.UserName,' - ',qr.UserLogin) LIKE '%" + searchParams.User + "%') AND ";

	query += " (qr.DateCompleted BETWEEN to_timestamp('" + searchParams.FromDate + "','YYYY/MM/DD-HH24:MI:SS') AND to_timestamp('" +  searchParams.ToDate + "','YYYY/MM/DD-HH24:MI:SS')) AND ";
	query += " (qr.FinalMark >= " + searchParams.FromMark + " AND qr.FinalMark <= " + searchParams.ToMark + " ) "
	query += " LIMIT " + searchParams.Top;

	return query;
}

/// <summary>
/// SQL query for get the db version
/// </summary>
GetQueryStringForGetDbVersion = () => {
	return "SELECT DbVersion FROM Settings";
}

/// <summary>
/// SQL query for get titles
/// </summary>
GetQueryStringForGetTitles = () => {
	return "SELECT QZ_ID, quizname, Title, DateModified FROM Quizzes";
}

/// <summary>
/// SQL query for get abstract of quiz results
/// </summary>
GetQueryStringForGetResultsAbstract = () => {
	return "SELECT QuizName, QuizTitle, UserName, UserLogin, DateCompleted, FinalMark FROM QuizResult";
}

/// <summary>
/// SQL query for update the date of last access
/// </summary>
GetQueryStringForUpdateDateLastAccess = (id) => {
	return "UPDATE Person SET DateLastAccess=NOW() WHERE id=" + id;
}

/// <summary>
/// SQL query for the size (in MBytes) of QuizFaber database
/// </summary>
GetQueryStringForDbSize = (dbName) => {
	return "SELECT pg_database_size(t1.datname)/1024/1024 AS dbsize FROM pg_database t1 WHERE t1.datname='" + dbName + "'";
}

/// <summary>
/// SQL query for store quiz results sent by QuizFaber client
/// </summary>
GetQueryStringFromQuiz = (quiz) => {

	var listValue = "";

	listValue += "'" + EscapeSpecialChar(quiz.options.name) + "',";  // QuizName
	listValue += "'" + EscapeSpecialChar(quiz.options.title) + "',"; // QuizTitle
	listValue += quiz.options.id + ","; // QuizID
	listValue += "'" + EscapeSpecialChar(quiz.currentUser.name) + "',"; // UserName
	listValue += "'" + EscapeSpecialChar(quiz.currentUser.email) + "',"; // UserLogin
	listValue += "'" + quiz.dateCompletedStr + "',";  // DateCompleted
	listValue += "'" + GetStringFromCurrentUtcDate() + "',";  // DateReceived
	listValue += quiz.options.numOfQuestions + ","; // QuestsNum
	listValue += quiz.options.maxmark + ",";  // HighestMark
	listValue += quiz.mark + ","; // FinalMark
	listValue += quiz.options.maxtime + ",";  // TotalTime
	listValue += quiz.time + ",";  // ElapsedTime
	listValue += quiz.nRight + ","; // RightQuestsNum
	listValue += quiz.nWrong + ","; // WrongQuestsNum
	listValue += quiz.numOfRetake; // NumOfRetake

	return "INSERT INTO QuizResult (QuizName,QuizTitle,QuizID,UserName,UserLogin,DateCompleted,DateReceived,QuestsNum,HighestMark,FinalMark,TotalTime,ElapsedTime,RightQuestsNum,WrongQuestsNum,NumOfRetake) VALUES (" + listValue + ") RETURNING id";
}

/// <summary>
/// SQL query for store report of a quiz results (what the student see in the response page)
/// </summary>
GetQueryStringForInsertQuizResultReport = (quizID, report) => {
	var listValue = "";

	listValue += quizID.toString() + ",";  // Id
	listValue += "'" + EscapeSpecialChar(report) + "'"; // report

	return "INSERT INTO QuizResultReport (ID,Report) VALUES (" + listValue + ")";
}

/// <summary>
/// SQL query for get the report of a quiz results (what the student see in the response page)
/// </summary>
GetQueryStringForQuizResultReport = (quizID) => {
	return "SELECT Report FROM QuizResultReport WHERE ID=" + quizID;
}

/// <summary>
/// SQL query for store all answers of a quiz results
/// </summary>
GetQueryStringForAllAnswers = (question, questionID) => {
	var allQueries = "";

	for (var j = 0; j < question.answers.length; j++) {
		var answer = question.answers[j];
		query = GetQueryStringFromAnswer(questionID, j + 1, answer);

		if (allQueries !== "") allQueries += ";";
		allQueries += query;
	}

	return allQueries;
}

/// <summary>
/// SQL query for store a question of a quiz results
/// </summary>
GetQueryStringFromQuestion = (quizID, num, question) => {
	var listValue = "";

	listValue += quizID.toString() + ",";  // IdQuizResult
	listValue += num.toString() + ",";  // QuestNum
	listValue += question.typeOfQuestion + ",";  // QuestType						
	listValue += question.weight + ",";  // Weight
	listValue += "'" + EscapeSpecialChar(question.shortTextQuestion) + "',";  // ShortTextQuestion
	listValue += question.valid + ",";  // Valid
	listValue += question.nScore + ",";  // Score
	listValue += question.maxScore + ",";  // MaxScore
	listValue += question.minScore;  // MinScore

	return "INSERT INTO QuizResultQuestion (IdQuizResult,QuestNum,QuestType,Weight,ShortTextQuestion, Valid, Score, MaxScore, MinScore) VALUES (" + listValue + ") RETURNING ID";
}

/// <summary>
/// SQL query for store an answerof a quiz results
/// </summary>
function GetQueryStringFromAnswer(questionID, answerNum, answer) {
	var listValue = "";

	listValue += questionID.toString() + ","; // IdResultQuestion
	listValue += answerNum.toString() + ","; // AnswerNum
	listValue += "'" + EscapeSpecialChar(answer.choice) + "',"; // Choice
	listValue += "'" + EscapeSpecialChar(answer.valuation) + "',"; // Valuation
	listValue += answer.isGuess + ","; // IsGuess
	listValue += answer.score + ","; // Score
	listValue += "'" + EscapeSpecialChar(answer.additionalText) + "',"; // AdditionalText
	listValue += "'" + EscapeSpecialChar(answer.shortTextAnswer) + "',"; // ShortTextAnswer
	listValue += "'" + EscapeSpecialChar(answer.shortTextRemark) + "'"; // ShortTextRemark

	return "INSERT INTO QuizResultAnswer (IdResultQuestion,AnswerNum,Choice,Valuation,IsGuess,Score,AdditionalText,ShortTextAnswer,ShortTextRemark) VALUES (" + listValue + ")";
}


/// <summary>
/// SQL query for store a session (login)
/// </summary>
GetQueryStringOpenSession = (personId, sessionId, ipLogin, isRecoverable) => {
	var listValue = "";

	listValue += personId.toString() + ",";  // personId
	listValue += "'" + sessionId + "',";  // sessionId
	listValue += "'" + ipLogin + "',";  // ipLogin
	listValue += (isRecoverable===0)?'FALSE':'TRUE';  // isRecoverable

	return "INSERT INTO QuizSession (PersonID,SessionID,IpLogin,IsRecoverable,DateCreated) VALUES (" + listValue + ",NOW())";
}

/// <summary>
/// SQL query for update a session (temp data)
/// </summary>
GetQueryStringUpdateDataSession = (personId, sessionId, sessionData) => {
	return "UPDATE QuizSession SET SessionData='" + sessionData + "', DateLastUpdate=NOW() WHERE PersonID=" + personId + " AND SessionID='" + sessionId + "'";
}

/// <summary>
/// SQL query for update a session (logout)
/// </summary>
GetQueryStringCloseSession = (personId, sessionId, ipLogout, quizId) => {
	return "UPDATE QuizSession SET IpLogout='" + ipLogout + "',QuizID=" + quizId + " WHERE PersonID=" + personId + " AND SessionID='" + sessionId + "'";
}

/// <summary>
/// SQL query for retrieve last opened session for a given user
/// </summary>
GetQueryStringGetLastOpenedSession = (personId) => {
	return "SELECT TOP(1) (SessionID, DateCreated, IpLogin, SessionData, DateLastUpdate, QuizID, IpLogout) FROM QuizSession WHERE PersonID=" + personId + " AND IsRecoverable=TRUE AND QuizID IS NOT NULL ORDER BY DateCreated DESC";
}

/*
 The escape character (\) needs to be escaped as (\\).
The single quote (') needs to be escaped ('') in single-quote quoted strings.
The double quote (") needs to be escaped as (\") or ("") in double-quote quoted strings.
The wild card character for a single character (_) needs to be escaped as (\_).
The wild card character for multiple characters (%) needs to be escaped as (\%).
 */
function EscapeSpecialChar(str) {
	var outStr = str.toString();

	outStr = outStr.replace(/'/g, "''");
	outStr = outStr.replace(/"/g, '\\"');
	outStr = outStr.replace(/_/g, '\\_');
	outStr = outStr.replace(/%/g, '\\%');

	return outStr;
}

function GetStringFromCurrentUtcDate()
{
	var currentdate = new Date();
	var now_utc = Date.UTC(currentdate.getUTCFullYear(), currentdate.getUTCMonth(), currentdate.getUTCDate(), currentdate.getUTCHours(), currentdate.getUTCMinutes(), currentdate.getUTCSeconds());
	return GetStringFromDate(new Date(now_utc));
}

function GetStringFromCurrentDate()
{
	var currentdate = new Date();
	return GetStringFromDate(currentdate);
}

function GetStringFromDate(myDate)
{
	var month = myDate.getMonth() + 1;
	return (myDate.getFullYear() + "-" + month + "-" + myDate.getDate() + " " + myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds());
}

module.exports = { GetQueryStringForCheckResult, GetQueryStringSelectPersor, GetQueryStringInsertPerson, GetQueryStringFromQuiz, GetQueryStringForInsertQuizResultReport, GetQueryStringForQuizResultReport, GetQueryStringForAllAnswers, GetQueryStringFromQuestion, GetQueryStringForQuizReport, GetQueryStringForQuestionReport, GetQueryStringForGetTitles, GetQueryStringForGetResultsAbstract, GetQueryStringForUpdateDateLastAccess, GetQueryStringForGetDbVersion, GetQueryStringForDbSize, GetQueryStringOpenSession, GetQueryStringUpdateDataSession, GetQueryStringCloseSession, GetQueryStringGetLastOpenedSession }