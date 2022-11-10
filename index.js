import express, { Router } from 'express';
import { engine } from 'express-handlebars';

import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import cookieParser from 'cookie-parser';

const dbPromise = open({
    filename: 'data.db',
    driver: sqlite3.Database
  })


const app = express()

app.engine('handlebars', engine())
app.set('view engine', 'handlebars')

app.use(express.urlencoded())
app.use(express.static('public'))
app.use(cookieParser())


/*render login and redirect to login*/ 
app.get('/home', async (req,res) =>{
    res.render('home',{
        PageTitle: 'home',
        style: 'style.css'})
})
/*render login to clear cookies*/
app.get('/', async (req,res) =>{
    res.render('home',{
        PageTitle: 'home',
        style: 'style.css'})
})

//route to home for logout and delete current user cookies
app.post('/', (req,res) => {
    res.clearCookie('priv')
    res.clearCookie('user')
    res.redirect('/')
})

//route to log if username and password exist
app.post('/home', async (req,res) =>{
    const db = await dbPromise;
    const {username, password} = req.body;
    const check = await db.get('SELECT COUNT(*) FROM Users WHERE (? = username AND ? = password);',username,password)
    const priv  = await db.get('SELECT (priv) FROM Users WHERE (? = username);',username)
    if(Object.values(check).toString() == 0){
        res.render('home',{
            PageTitle: 'home w error',
            style:'style.css',
            error: 'Please enter a valid Username and Password'
        })
    }
    else{
        res.cookie('priv',priv.priv)
        res.cookie('user',username)
        if (priv.priv == 'student')
            res.redirect('log');
        else
            res.redirect('logTeach');
    }

})

//route to home and validate empty input and check if username already exists and route to register
app.post('/register', async (req,res) =>{
    const db = await dbPromise
    const {username, password} = req.body;
    const check = await db.get('SELECT COUNT (username) FROM Users WHERE ? = username;',username)
    const priv  = await db.get('SELECT (priv) FROM Users WHERE (? = username);',username)
    if(username === "" && password === ""){
        res.render('register',{
            PageTitle: 'user Registration w error',
            style: 'style.css',
            error: 'Invalid Empty Username and Password'
        })
    }
    else if( Object.values(check).toString() == 1){
        res.render('register',{
            PageTitle: 'user Registration w error',
            style: 'style.css',
            error: 'Username taken please choose another '
        })
    }
    else{
        await db.run("INSERT INTO Users (username, password) VALUES (?,?);", username, password)
        res.redirect('home')
    }
})

//route to courses inside log
app.post('/course',cookieVal, async (req,res) => {
    const db = await dbPromise
    const priv  = await db.get('SELECT (priv) FROM Users WHERE (? = username);',req.cookies.user)
    const course = req.body;
    const Courses = await db.all('SELECT DISTINCT name FROM Grades INNER JOIN Users INNER JOIN Courses WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND username = ?;',req.cookies.user)
    var avg = await db.all("SELECT ((grade1 + grade2 + grade3)/3) AS avg FROM Users INNER JOIN Grades INNER JOIN Courses WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND name = ? AND priv ='student';",Object.values(course).toString())
    console.log(avg)
    if(priv.priv == 'student'){
        var Grades = await db.all("SELECT * FROM Users INNER JOIN Grades INNER JOIN Courses WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND name = ? AND username = ?;",Object.values(course).toString(),req.cookies.user)
        res.render('log', {
            avg,
            Courses,
            Grades,
            PageTitle: 'first',
            style: 'log.css',
            js: 'log.js'
        })
    }
    else{
        var Grades = await db.all("SELECT * FROM Users INNER JOIN Grades INNER JOIN Courses WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND name = ? AND teacherName = ?;",Object.values(course).toString(),req.cookies.user)
        res.render('logTeach', {
            Courses,
            Grades,
            PageTitle: 'first',
            style: 'log.css',
            js: 'log.js'
        })
    }
})

//route to log for home button
app.post('/log', (req,res) => {
    res.redirect('log')
})

//route to logTeach for home button
app.post('/logTeach', (req,res) => {
    res.redirect('logTeach')
})
//simply check current user and priv with cookies
function cookieVal(req,res,next){
    const { cookies } = req
    console.log(cookies)
    next()
}

/*redirect to log*/ 
app.get('/logTeach',cookieVal, async (req,res) => {
    const db =  await dbPromise;
    const Courses = await db.all('SELECT name FROM Grades INNER JOIN Users INNER JOIN Courses  WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND username = ?;',req.cookies.user)
    res.render('logTeach', {
        Courses,
        PageTitle: 'first',
        style: 'log.css',
        js: 'log.js'
    })
})

/*redirect to logTeach*/ 
app.get('/log',cookieVal, async (req,res) => {
    const db =  await dbPromise;
    const Courses = await db.all('SELECT name FROM Grades INNER JOIN Users INNER JOIN Courses  WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND username = ?;',req.cookies.user)
    res.render('log', {
        Courses,
        PageTitle: 'first',
        style: 'log.css',
        js: 'log.js'
    })
})

/*
//render helloWorld and save messages in db and display messages
app.post ('/helloWorld',async (req,res) => {
    const db = await dbPromise
    const messageText = req.body.messageText
    await db.run("INSERT INTO Messages (text) VALUES (?);", messageText)
    res.redirect('helloWorld')
})

app.get('/helloWorld', async (req,res) => {
    const db =  await dbPromise;
    const messages = await db.all('SELECT * FROM Messages;')
    res.render('helloWorld', {messages})
})

//get the current time
app.get('/Time', (req,res) => {
    res.send("Local time: " + (new Date()).toLocaleTimeString())
})
*/

   //=============
//Graph begin

app.get("/", function(req,res){
    res.sendFile(__dirname + "/chart.png");
  
 });


var lcs = require('line-chart-simple');



var xvalues = ["A","B","C","D","E","F","G","H","I","J","K"]; //list of x cordinate student names
var project_test = xvalues.map(function(x){return Math.random()*100;}); // Test/project average values
var midterm = xvalues.map(function(x){return Math.random()*100;}); // mid term exam
var final_exam = xvalues.map(function(x){return Math.random()*100;}); // Final term final exam
var final_total = xvalues.map(function(x){return Math.random()*100;}); // Total average


var classPerfomance = {
    Project_Average: project_test,
    Mid_term: midterm,
    Final_Exam: final_exam,
    Total_average: final_total,

}


// colours for topics
classPerfomance.Project_Average.color='rgb(255, 0, 0)';
classPerfomance.Mid_term.color='rgb(0, 225, 0)';
classPerfomance.Final_Exam.color='rgb(0, 0, 255)';
classPerfomance.Total_average.color='rgb(0, 0, 0)';

var dots = { //put colored dots at specified indices
    'rgb(255, 0, 0)': [1,2,3],
    'rgb(0, 0, 255)': [4,5,6],
    'rgb(0, 255, 0)': [7,8,9],
    
};

var width = 1000;
var height = 800;
var bgColor = 'white';
lcs.plotSimpleChart("chart.png", xvalues, classPerfomance ,dots, width  , height, bgColor);

// Graph ends
//==============

const setup = async() => {
    const db = await dbPromise
    await db.migrate()

    app.listen(8000, () => {
        console.log("listening on port:8000")
    })
}

setup()
