const Users =require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt =require ('bcrypt');
const dotenv = require('dotenv');
const { json } = require('express');
dotenv.config();

const userController ={
    register : async(req,res)=>{
    try{

    const {name,email,password} = req.body;
    

    const user =await Users.findOne({email})
    if(user)return res.status(400).json({msg:"Email Already Exist"})

    if(password.length <6)
        return res.status(400).json({msg:"password must be of 6 charaters"})


    const passwordHash =await bcrypt.hash(password,10)

    const newUser =new Users({
        name,email,password:passwordHash
    })
    
    await newUser.save();



const accesstoken =createAccessToken({id:newUser._id})
const refreshtoken =createRefreshToken({id:newUser._id})

res.cookie('refreshtoken',refreshtoken,{
    httpOnly:true,
    path:'/user/refresh_token'
})

        res.json({accesstoken});
       
    }
    catch(err){
        return res.status(500).json({msg:err.message})

    }
 },
 refreshtoken :async (req,res)=>{

    try{
        const rf_token = req.cookies.refreshtoken;

        if(!rf_token) return res.status(400).json({msg:"please login or registers"});

        const secret =process.env.REFRESH_TOKEN_SECRET||'defaultsecretkey'

        jwt.verify(rf_token,secret,(err,user)=>{
            if(err) return res.status(400).json({msg:"please login or register"})

                const  accesstoken =createAccessToken({id:user.id})
            res.json({user,accesstoken})
        })
    

    }
    catch(err){
return res.status(500).json({msg:err.message})
    }
    

 },
 login:async(req,res)=>{

    try{
      const {email,password} =req.body;
      const user =await Users.findOne({email})
      if(!user) return res.status(400).json({msg:"User  does nor exits"})

      const isMatch =await bcrypt.compare(password,user.password)
      if(!isMatch) return res.status(400).json({msg:"Incorrect password"})


        const accesstoken =createAccessToken({id:user._id})
        const refreshtoken =createRefreshToken({id:user._id}) 

        res.cookie('refreshtoken',refreshtoken,{
            httpOnly:true,
            path:'/user/refresh_token'
        })

      res.json({accesstoken})

    }catch(err){
        return res.status(500).json({msg:"err.message"})
    }
 },
 logout:async(req,res)=>{
    try{
         res.clearCookie('refreshtoken',{path:'/user/refresh_token'})
         return res.json({msg:"Log out"})
    }catch(err){

    }
 },
 getUser :async(req,res)=>{
    try{
        const user =await Users.findById(req.user.id).select(`-password`)
        if(!user) return res.status(400).json({msg:"User not  found"})

      res.json(user)
    }
    catch(err){

    }
 }
}
const createAccessToken =(payload) =>{
    const secret =process.env.ACCESS_TOKEN_SECRET||'defaultsecretkey'
    return jwt.sign(payload,secret,{expiresIn:'1d'})
}
const createRefreshToken =(payload) =>{
    const secret =process.env.REFRESH_TOKEN_SECRET||'defaultsecretkey'
    return jwt.sign(payload,secret,{expiresIn:'7d'})
}
 module.exports =userController;