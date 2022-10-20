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


/*render home and register users*/ 
app.get('/', async (req,res) =>{
    res.render('home',{
        PageTitle: 'home',
        style: 'style.css'})
})

app.post('/', async (req,res) =>{
    const db = await dbPromise
    const {username, password} = req.body
    await db.run("INSERT INTO Users (username, password) VALUES (?,?);", username, password)
    res.redirect('log');
})

/*render log, redirect to home and to courses*/ 
app.get('/log', async (req,res) => {
    res.render('log', {
        PageTitle: 'first',
        layout: 'first'
    })
})

app.post('/log', (req,res) => {
    res.redirect('/')
})


/*render helloWorld and save messages in db and display messages*/
app.get('/helloWorld', async (req,res) => {
    const db =  await dbPromise;
    const messages = await db.all('SELECT * FROM Messages;')
    res.render('helloWorld', {messages})
})

app.post ('/message',async (req,res) => {
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
