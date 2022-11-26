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
        PageTitle: 'Home - Management++',
        style: 'style.css'})
})
/*render login to clear cookies*/
app.get('/', async (req,res) =>{
    res.render('home',{
        PageTitle: 'Home - Management++',
        style: 'style.css'})
})

//route to home for logout and delete current user cookies
app.post('/', (req,res) => {
    res.clearCookie('priv')
    res.clearCookie('user')
    res.clearCookie('course')
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
    res.cookie('course',Object.values(course).toString())
    const Courses = await db.all('SELECT DISTINCT name FROM Grades INNER JOIN Users INNER JOIN Courses WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND username = ?;',req.cookies.user)
    if(priv.priv == 'teacher'){
        var Grades = await db.all("SELECT *,((grade1 + grade2 + grade3)/3) AS avg FROM Users INNER JOIN Grades INNER JOIN Courses WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND name = ? AND teacherName = ?;",Object.values(course).toString(),req.cookies.user)
        res.render('logTeach', {
            Courses,
            Grades,
            PageTitle: Object.values(course).toString() + ' - Management++',
            style: 'log.css',
            js: 'log.js'
        })
    }
    else{
        var Grades = await db.all("SELECT *,((grade1 + grade2 + grade3)/3) AS avg FROM Users INNER JOIN Grades INNER JOIN Courses WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND name = ? AND username = ?;",Object.values(course).toString(),req.cookies.user)
        res.render('log', {
            Courses,
            Grades,
            PageTitle: Object.values(course).toString() + ' - Management++',
            style: 'log.css',
            js: 'log.js'
        })
    }
})

app.get('/course', cookieVal, async (req,res) => {
    const db = await dbPromise
    const priv  = await db.get('SELECT (priv) FROM Users WHERE (? = username);',req.cookies.user)
    const course = req.cookies.course
    const Courses = await db.all('SELECT DISTINCT name FROM Grades INNER JOIN Users INNER JOIN Courses WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND username = ?;',req.cookies.user)
    if(priv.priv == 'student'){
        var Grades = await db.all("SELECT *,((grade1 + grade2 + grade3)/3) AS avg FROM Users INNER JOIN Grades INNER JOIN Courses WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND name = ? AND username = ?;",course,req.cookies.user)
        res.render('log', {
            Courses,
            Grades,
            PageTitle: course + ' - Management++',
            style: 'log.css',
            js: 'log.js'
        })
    }
    else{
        var Grades = await db.all("SELECT *,((grade1 + grade2 + grade3)/3) AS avg FROM Users INNER JOIN Grades INNER JOIN Courses WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND name = ? AND teacherName = ?;",course,req.cookies.user)
        res.render('logTeach', {
            Courses,
            Grades,
            PageTitle: course + ' - Management++',
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

//route to gradesManagement for when teacher is logged in
app.post('/editGrades', (req,res) => {
    // TODO
})
//route to addStudent for when teacher is logged in
app.post('/addStudent', (req,res) => {
    console.log(req.body)
    res.redirect('addStudent')
})
app.get('/addStudent', async (req,res) => {
    const db = await dbPromise
    const c_id = await db.get("SELECT c_id FROM Courses WHERE name = ?;", req.cookies.course)
    var StudentNotInClass = await db.all("SELECT Users.u_id,Users.username FROM Users WHERE Users.u_id NOT IN(SELECT Users.u_id FROM Users,Grades WHERE Users.u_id = Grades.u_id AND Users.priv ='student' AND Grades.c_id = ?) AND priv = 'student';", Object.values(c_id).toString())
    console.log(StudentNotInClass)
    res.render('addStudent', {
        StudentNotInClass,
        style: 'log.css',
        js: 'log.js'
    })
})
//route to removeStudent for when teacher is logged in
app.post('/removeStudent',cookieVal, async (req,res) => {
    const db = await dbPromise
    let keys = Object.keys(req.body)
    const u_id = req.body[keys[0]]
    const c_id = req.body[keys[1]]
    db.run('DELETE FROM GRADES where u_id= ? AND c_id = ?', u_id, c_id)
    // TODO refresh the course page with the student removed
    res.redirect('course')
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
        PageTitle: 'Teacher Portal - Management++',
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
        PageTitle: 'Student Portal - Management++',
        style: 'log.css',
        js: 'log.js'
    })
})

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
