//=========================================
// File name: definitions.js
//-----------------------------------------
// Project : QuizFaber 
// Licence : MIT
// Author  : Luca Galli
// Email   : info@quizfaber.com
//=========================================

class Login
{
	constructor(id, name, email, hashPassword) {
		this.id = id;
		this.name = name;
		this.email = email;
		this.password = hashPassword;
		this.sessionId = null;
		this.otherFields = new Object();
	}
}

class Quiz
{
	constructor(id, name, title, date) {
		this.Id = id;
		this.Name = name;
		this.Title = title;
		this.DateModified = date;
	}
}

class ResultItem {
	constructor(type, weight, selected, response) {
		this.TypeOfQuest = type;
		this.Weight = weight;
		this.SelectedAnswers = selected;
		this.Response = response;
		this.ShortTextQuestion = '';
		this.Valid = 0;
	}
}
class ResultHeader {
	constructor() {
		this.Name;
		this.Title;
		this.Author;
		this.Argument;
		this.Duration;
		this.NumOfQuestions;
	}
}

class Result {
	constructor() {
		this.Id;
		this.UserName;
		this.UserLogin;
		this.DateCompleted;
		this.ElapsedTime;
		this.HighestMark;
		this.NumCorrectAnswers;
		this.NumWrongAnswers;
		this.NumNotValutated;
		this.FinalMark;
		this.Answers = [];
		this.Header = null;
	}
}

class Abstract {
	constructor(title, user, date, mark) {
		this.Title = title;
		this.User = user;
		this.Date = date;
		this.Mark = mark;
	}
}

class SearchParams {
	constructor(title, user, fromDate, toDate, fromMark, toMark, top) {
		this.Title = title;
		this.User = user;
		this.FromDate = fromDate;
		this.ToDate = toDate;
		this.FromMark = fromMark;
		this.ToMark = toMark;
		this.Top = top;
	}
}

class RetakeInfo
{
	constructor(numOfRetake, finalMark)
	{
		this.NumOfRetake = numOfRetake;
		this.FinalMark = finalMark;
	}
}

class SessionInfo {
	constructor(personId) {
		this.PersonId = personId;
		this.SessionId = '';
		this.DateCreated = null;
		this.IpLogin = '';
		this.SessionData = null;
		this.DateLastUpdate = null;
		this.QuizId = 0;
		this.IpLogout = '';
		this.IsRecoverable = false;
	}
}

module.exports = { Login, Quiz, Abstract, ResultItem, ResultHeader, Result, SearchParams, RetakeInfo, SessionInfo };
