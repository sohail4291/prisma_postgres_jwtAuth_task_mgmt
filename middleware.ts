import jwt from "jsonwebtoken"
import "dotenv";
import prisma from "./lib/client-setup.js"
import type { Request, Response,NextFunction } from "express";

const secretKey: any = process.env.SECRET_KEY;
if(!secretKey){
    throw new Error("Secret key not defined");
}

declare global{
    namespace Express {
        interface Request{
            cookies : { [key : string] : string};
        }
    }
}

async function authmiddleware(req:Request,res : Response,next : NextFunction){
    const start = process.hrtime.bigint();
    

   const token = req.cookies.token;
   if(!token){
    return res.status(401).send("unauthorized");
   }
    // console.log(token);
    const decoded = jwt.verify(token,secretKey);
    // console.log(decoded);
    if(!decoded){
        return res.send("malfunctioned token");
    }
    if(typeof decoded === "string" || typeof decoded.id !== "number"){
        throw new Error("invalid cookie");
    }
    const id = decoded.id;
    const userExist = await prisma.prisma.user.findUnique({ where : { id : id }})

    if(!userExist){
        return res.send("user doesn't exists");
    }
    res.locals.id = userExist.id;
    const end = process.hrtime.bigint();
    const duration = Number(end - start)/1000000;
    console.log("authmiddleware : ", duration, "ms");
    next();
}


async function timemiddleware(req:Request,res:Response,next:NextFunction){
    const start = process.hrtime.bigint();
    
    res.on("finish", () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000;
        console.log( `${req.method}  ${req.originalUrl}, ${res.statusCode}, ${duration.toFixed(2)} ms`)

    })
    next();
}
export {authmiddleware, timemiddleware};