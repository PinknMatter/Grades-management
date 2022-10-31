import express, { Router } from 'express';
import { engine } from 'express-handlebars';

import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const dbPromise = open({
    filename: 'data.db',
    driver: sqlite3.Database
  })


const app = express()
/*const path = require('path')*/

app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
/*app.set('views', './views');*/

app.use(express.urlencoded())
app.use(express.static('public'))


/*render login and redirect to login*/ 
app.get('/', async (req,res) =>{
    res.render('home',{
        PageTitle: 'home',
        style: 'style.css'})
})

app.post('/', (req,res) => {
    res.redirect('/')
})

//redirect to log if username and password exist
app.post('/home', async (req,res) =>{
    const db = await dbPromise;
    const {username, password} = req.body;
    const check = await db.get('SELECT COUNT(*) FROM Users WHERE (? = username AND ? = password);',username,password)
    console.log(Object.values(check).toString())

    if(Object.values(check).toString() == 0){
       console.log(username)
       console.log(password)
        res.render('home',{
            PageTitle: 'home w error',
            style:'style.css',
            error: 'Please enter a valid Username and Password'
        })
    }
    else{
        res.redirect('log')
    }

})

//redirect to register and validate empty input and check if username already exists
app.post('/register', async (req,res) =>{
    const db = await dbPromise
    const {username, password} = req.body;
    const check = await db.get('SELECT COUNT (username) FROM Users WHERE ? = username;',username)

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
        res.redirect('log');
    }
})



/*redirect to log home and to courses*/ 
app.get('/log', async (req,res) => {
    const db =  await dbPromise;
    const Courses = await db.all('SELECT (name) FROM Courses;')
    res.render('log', {
        Courses,
        PageTitle: 'first',
        style: 'log.css',
        js: 'log.js'
    })
})

app.post('/course', async (req,res) => {
    const db = await dbPromise
    const course = req.body;
    const Grades = await db.all("SELECT * FROM Users INNER JOIN Grades INNER JOIN Courses WHERE Users.u_id = Grades.u_id AND Courses.c_id = Grades.c_id AND name = ?",Object.values(course).toString())
    const Courses = await db.all('SELECT (name) FROM Courses;')
    res.render('log', {
        Courses,
        Grades,
        PageTitle: 'first',
        style: 'log.css',
        js: 'log.js'
    })
})


app.post('/log', (req,res) => {
    res.redirect('log')
})


/*render helloWorld and save messages in db and display messages*/
app.get('/helloWorld', async (req,res) => {
    const db =  await dbPromise;
    const messages = await db.all('SELECT * FROM Messages;')
    res.render('helloWorld', {messages})
})

app.post ('/helloWorld',async (req,res) => {
    const db = await dbPromise
    const messageText = req.body.messageText
    await db.run("INSERT INTO Messages (text) VALUES (?);", messageText)
    res.redirect('helloWorld')
})

/* get the current time*/ 
app.get('/Time', (req,res) => {
    res.send("Local time: " + (new Date()).toLocaleTimeString())
})


const setup = async() => {
    const db = await dbPromise
    await db.migrate()

    app.listen(8000, () => {
        console.log("listening on port:8000")
    })
}

setup()
