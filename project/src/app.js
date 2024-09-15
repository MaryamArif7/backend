import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
//CORS allows your server to accept requests
// from different origins (domains or ports). Without configuring CORS, browsers block requests from different origins for security reasons.
app.use(cors({
    /*
    What is Cors issue?
    ->when a web appliaction running in one origin attempt to acess
    recources from differen torigin(domain,protocol,port) ,sever doesnt allow it directly
    How to solve?
    ->whitlist is also a method,a CORS whitlist specifies which domain are allowed to make requests to the server
    ->1 ->The method below is the 1st solution ,by putting which domain we wnat to allow
    in this case it will be the frontend domain ,the origin will be the fronent link
    2->we can allow origins by putting * ->basically known as wild card
    */
    origin: process.env.CORS_ORIGIN,
    //This option allows cookies and HTTP authentication information (like tokens) to be included in cross-origin requests.
    credentials: true
}))
/*
1->express.json()->built in middleware function that parses incoming requests
with json payloads
->when a client sends a req to the server wioth content type:application/json header
this one extracrs the json data and and makes it availbe in the rq.body
->basiaccly without express.json ,express will ot parse
the incoming requets as json.Without this ,if the server recive a req with json data
it wont be able to acess that data ,so to convert that data from json to js obj
->form submiited->in json format->to the network as the body of the HTTP req->on server side ->middleware aceepts the incopming req as json bodies and coverts ot js obj
->then the parsed obj is made availble to the req.body
*/

app.use(express.json({limit: "16kb"}))
/*
2->urlencoded->When a request is made with application/x-www-form-urlencoded content type, express.urlencoded() middleware intercepts the incoming request.
-> In this format, spaces are replaced with + and other special characters are encoded using %.
name=John+Doe&age=25&email=john%40example.com
->It parses the URL-encoded data from the request body and converts it into a JavaScript object
-> parse incoming requests with application/x-www-form-urlencoded payloads, typically from HTML form submission
*/
app.use(express.urlencoded({extended: true, limit: "16kb"}))
//static files->HTML files/css/images/js
//->these files ccan be sent direclt to the client without the processing of the server
//sopose public folder has logo.png then this image can b eacessed from the client side http:server.com/logo.png
//Without express.static(), you would have to manually write routes for each asset
app.use(express.static("public"))
app.use(cookieParser())
//cookie-parser is a middleware for Express that helps handle HTTP cookies. It parses cookies from the client request and makes them available as an easily accessible object on the req.cookies property.


//routes import
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
//app.use->for middlewares:Used to apply middleware. Middleware functions are functions that have 
//access to the request (req), response (res), and the next middleware function in the application’s request-response cycle.
//app.get ->For get requests: When app.get(path, callback) is used,
// it matches the exact path (and not other HTTP methods) and executes the callback only when the method is GET.
//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

// http://localhost:8000/api/v1/users/register

export { app }