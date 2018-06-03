const express = require("express")
const morgan = require("morgan")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")

const newsRouters = require("./routes/news")

mongoose.connect('mongodb://localhost/battlerite')
mongoose.Promise = global.Promise

const app = express()

app.use(morgan("dev"))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// Prevent cors error
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization')

    if (res.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, PATCH, POST, GET, DELETE')
        return res.status(200).json({})
    }
    next()
})

// Routes which should handle requests
app.use('/news', newsRouters)

// Handle wrong routes
app.use((req, res, next) => {
    const error = new Error('Not found')
    error.status = 404
    next(error)
})
app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({
        error: {
            message: error.message,
            status: error.status
        }
    })
})

module.exports = app