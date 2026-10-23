import express from "express";
import  prisma  from "./lib/client-setup.js"
import "dotenv/config"
import {authmiddleware} from "./middleware.js"
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"
import pinoHttp from "pino-http"
import {timemiddleware} from "./middleware.js"
import z from "zod"
import bcrypt from "bcrypt";



const secretKey = process.env.SECRET_KEY;
if(! secretKey){
    throw new Error(`Error : Invalid secret key => ${secretKey}`);
}
const port = Number(process.env.PORT);
const app = express();
app.use(express.json())
app.use(cookieParser());
app.use(timemiddleware);



// prisma.user.findUnique()
// prisma.user.findUniqueOrThrow()
// prisma.user.findFirst()
// prisma.user.findFirstOrThrow()
// prisma.user.findMany()
// 200, 201, 204 (not content)

const object = z.object({
    username : z.string().min(4,"must be minium 4 letters").max(10, "max 10 letters"),
    password : z.string().min(6,"min 6 digits").max(14,"max 14 digits")
})

app.post("/signup",async(req,res,next)=>{
   // validate the schema
   // check for the user in prisma db
   // create a user
   // send the username message
   // error handle the zod validation or user

   try{
    // zod validation
    const data = await object.parseAsync({ username : req.body.username, password : req.body.password});

    // check for the user in db
    const userExists = await prisma.prisma.user.findUnique({ where : { username : data.username}});
    if(userExists){
        return res.send({ "user exists with name : ":  data.username});
    }

    // create a user
    const hashedpassword = await bcrypt.hash(data.password,10);
    const user = { username : data.username, password : hashedpassword };

    const adduser = await prisma.prisma.user.create({ data : user});

    res.send({ "user created successfully " : adduser.username});
   }catch(error){
        
        if(error instanceof z.ZodError){
            res.send({
                "error message" : "invalid input",
                "errors " : error.issues.map(issue => 
                    ({ field : issue.path[0],
                      message : issue.message
                    })
                )
            })
        }
        
   }
})

app.post("/signin",async(req,res,next)=>{

    // input validate 
    // check for the user 
    // match the password 
    // create jwt and send the response 
    // error handling
    try{
        const data = await object.parseAsync( { username : req.body.username, password : req.body.password });

        const userExist = await prisma.prisma.user.findUnique({where : { username : data.username}});
        if(!userExist){
            res.send({ "user does not exist " : data.username});
            return;
        }

        const passwordmatch  = await bcrypt.compare(data.password , userExist?.password);
        console.log("passwordmatch  ", passwordmatch);
        if(!passwordmatch){
            res.send({ message : "invalid password"});
            return;
        }

        const token = await jwt.sign(data,secretKey);
        res.cookie("token", token, { expires : new Date(Date.now() + 60 * 60 * 1000)});
        res.send({ "user logged in " : userExist.username , "token " : token});

    }
    catch(error){
        if(error instanceof z.ZodError){
            res.send({ 
                "message " : "validation failed",
                "errors " : error.issues.map( issue => ({ field : issue.path[0], message : issue.message}))
            })
        }
        next(error); // pass to centralised error handler
    }
    



    
    // const start = process.hrtime.bigint();
    // const username = req.body.username;
    // const password = req.body.password;
    // if(!username || !password){ return res.send({"username & password required" : "not a valid one"});}
    // console.log(username, password );
    
    // const userExist = await prisma.prisma.user.findUnique({ where : { username : username}})
    // if(!userExist){
    //     return res.send({ "user not exist" : "not found"});
    // }
    // if(userExist.password !== password){
    //     return res.send({ message : "invalid username or password"})
    // }
    // const id = userExist.id;
    // const token  = jwt.sign({id : id, username:username, password : password},secretKey ,{algorithm : "HS256"});
    // res.cookie("token", token, {expires : new Date(Date.now() + 60 * 10 * 1000 )});
    // res.send({ token : token});
    // const end = process.hrtime.bigint();
    // const total = Number(end-start) /1000000;
    // console.log(total);
    // next();
});





app.get("/get",authmiddleware,async(req,res,next)=>{

    console.log( typeof  res.locals.id);
    const userId:number = res.locals.id;
    const gettodos = await prisma.prisma.posts.findMany({ where : { userId : userId}});
    if(gettodos.length == 0){
        const response = "no todos in your bucket";
        return res.send(response);
    }
    res.send(gettodos );
    
})

app.post("/add-todo/",authmiddleware, async(req,res,next)=>{
    const userId:number = res.locals.id;
    const title = req.body.title;
    const description = req.body.description;
    if(!title || !description){
        return res.send("title && description required");
    }

    const findsimilartitle = await prisma.prisma.posts.findUnique({ where : { title : title, userId : userId }});
    console.log(findsimilartitle);
    if(findsimilartitle != null){
        return res.send({ "title already exists for userId : ": userId});
    }
    const add = await prisma.prisma.posts.create({
        data : { title : title, description : description, userId : userId}
    });

    res.send({ "todo added " : add});
});

app.put("/edit-todo",authmiddleware, async(req,res,next)=>{
    const userId = res.locals.id;
    const title = req.body.title;
    const newtitle = req.body.newtitle;
    const description = req.body.description;
    const find  = await prisma.prisma.posts.findUnique({ where  : { title : title, userId : userId }});
    if(find == null){
        return res.send({"not todo found with title " : title });
    }
    const updated = await prisma.prisma.posts.update({where : { title : title, userId : userId},
        data : { title : newtitle , description : description}
    })
    res.send(updated);
})



app.delete("/delete-todo/",async(req,res,next)=>{
    const userId = res.locals.id;
    const title = req.body.title;
    
    const find = await prisma.prisma.posts.findUnique({ where : { userId : userId, title : title}});
    console.log(find);
    if(!find){
        return res.send("not found");
    }
    const deleted = await prisma.prisma.posts.delete({ where : {  userId : userId, title : title}});

    res.send(deleted);
})



app.listen(3000, () => console.log("server is listening at port "+ port));