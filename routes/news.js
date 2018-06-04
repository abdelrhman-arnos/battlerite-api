const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const fs = require('fs')

const multer = require('../config/multer')

require('dotenv').config()

const News = require("../models/news")
const Images = require("../models/images")

router.get('/', (req, res, next) => {
    News.find().exec()
        .then(docs => {
            const response = {
                status: 200,
                count: docs.length,
                news: docs.map(news => {
                    return {
                        _id: news._id,
                        premalink: news.premalink,
                        subTitle: news.subTitle,
                        created_at: news.created_at,
                        content: news.content,
                        title: news.title,
                        img: {
                            id: news.imgId,
                            path: news.imgPath,
                        },
                        request: {
                            type: 'GET',
                            url: `${process.env.URL}/news/${news._id}`
                        }
                    }
                }),
            }
            res.status(200).json(response)
        })
        .catch(err => {
            res.status(500).json({error: err})
        })
})

router.post('/', multer.single('img'), (req, res, next) => {
    const imageId = mongoose.Types.ObjectId()
    const image = new Images({
        _id: imageId,
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        destination: req.file.destination,
        filename: req.file.filename,
        path: `${req.file.destination.split('./')[1]}/${imageId}.${req.file.originalname.split('.')[1]}`,
        size: req.file.size,
    })

    /** Save image **/
    image
        .save()
        .then(img => {
            /** Rename the image file **/
            fs.rename(`${image.destination}/${image.originalname}`, image.path, err => {
                if (err) res.status(500).json({error: err})
            })
            /** End:Rename the image file **/
            const news = new News({
                _id: mongoose.Types.ObjectId(),
                premalink: req.body.premalink,
                subTitle: req.body.subTitle,
                content: req.body.content,
                imgPath: img.path,
                imgId: img._id,
                title: req.body.title,
            })
            /** Save news **/
            news
                .save()
                .then(docs => {
                    const response = {
                        status: 201,
                        message: 'Created news successfully',
                        news: {
                            _id: docs._id,
                            premalink: docs.premalink,
                            subTitle: docs.subTitle,
                            content: docs.content,
                            title: docs.title,
                            img: {
                                id: docs.imgId,
                                path: docs.imgPath,
                            },
                            request: {
                                type: 'GET',
                                url: `${process.env.URL}/news/${docs._id}`
                            }
                        },
                    }
                    res.status(201).json(response)
                })
                .catch(err => {
                    res.status(500).json({error: err})
                })
            /** End:Save news **/
        })
        .catch(err => {
            res.status(500).json({error: err})
        })
    /** End:Save image **/
})

router.get('/:newsId', (req, res, next) => {
    News.findById(req.params.newsId).exec()
        .then(docs => {
            const response = {
                status: 200,
                news: {
                    _id: docs._id,
                    premalink: docs.premalink,
                    subTitle: docs.subTitle,
                    content: docs.content,
                    title: docs.title,
                    created_at: docs.created_at,
                    updated_at: docs.updated_at,
                    img: {
                        id: docs.imgId,
                        path: docs.imgPath,
                    },
                    request: {
                        type: 'GET',
                        description: 'Get all news',
                        url: `${process.env.URL}/news`
                    }
                }
            }
            res.status(200).json(response)
        })
        .catch(err => {
            res.status(500).json({error: err})
        })
})

router.patch('/:newsId', (req, res, next) => {
    const id = req.params.newsId
    const updateOps = {updated_at: Date.now()}

    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value
    }
    console.log(updateOps)

    News.update({_id: id}, {$set: updateOps}).exec()
        .then(docs => {
            const reponse = {
                message: 'News updated',
                request: {
                    type: 'GET',
                    url: `${process.env.URL}/news/${id}`
                },
                status: 200
            }
            res.status(200).json(reponse)
        })
        .catch(err => {
            res.status(500).json({error: err})
        })
})

router.delete('/:newsId', (req, res, next) => {
    const id = req.params.newsId;
    News.remove({_id: id}).exec()
        .then(docs => {
            const request = {
                type: 'GET',
                url: `${process.env.URL}/news`,
            }
            if (!docs.n) {
                res.status(404).json({
                    status: 404,
                    message: 'Not found',
                    request,
                })
            } else {
                res.status(200).json({
                    status: 200,
                    message: 'News deleted',
                    request,
                })
            }
        })
        .catch(err => {
            res.status(500).json({error: err})
        })
});

module.exports = router