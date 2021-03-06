// 登录&注册
const express = require('express')
const router = express.Router()
const User = require('../../models/User')
const bcrypt = require('bcrypt')
const gravatar = require('gravatar')
const jwt = require('jsonwebtoken')
const keys = require('../../config/keys')
const passport = require('passport')

// $route   GET api/users/test
// @desc    返回请求的json数据
// @access  public
// router.get('/test', (req, res) => {
//   res.json({ msg: 'it working' })
// })

// $route   GET api/users/register
// @desc    返回请求的json数据
// @access  public
router.post('/register', (req, res) => {
  //查询数据库中是否已有该邮箱
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user) {
        return res.status(400).json('邮箱已被占用')
      } else {
        const avatar = gravatar.url(req.body.email, { s: '200', r: 'pg', d: 'mm' }) //s表示大小，r表示，d表示
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar,
          identity: req.body.identity,
          password: req.body.password,
        })

        //用bcrypt给密码加密
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) { throw err }
            newUser.password = hash
            newUser.save()
              .then(user => res.json(user))
              .catch(err => console.log(err))
          })
        })
      }
    })
})

// $route   POST api/users/login
// @desc    返回请token jwt passport
// @access  public
router.post('/login', (req, res) => {
  const email = req.body.email
  const password = req.body.password
  //查询数据库，是否存在该账号
  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(404).json('用户不存在')
      }
      //密码匹配
      bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (isMatch) {
            const rule = {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              identity: user.identity
            }
            //匹配成功后，使用jwt，返回一个token
            //jwt.sign('规则','加密名字','过期时间','执行函数')
            jwt.sign(rule, keys.secretOrKey, { expiresIn: 3600*24 }, (err, token) => {
              if (err) throw err
              res.json({
                success: true,
                token: "Bearer " + token
              })
            })
          } else {
            return res.status(400).json('密码错误')
          }
        })
    })
})

// $route   GET api/users/current
// @desc    返回current user
// @access  private
// 用passport验证token
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    identity: req.user.identity
  })
})

module.exports = router