import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
/* Theory : 
An important thing to keep in mind about JWT is that it is a 
signed token and not an encrypted one. Therefore, even though JWT can verify 
the integrity of the claims contained within it, it cannot hide that information. 
And because of that, it is advisable not to put any sensitive information within the token
1->JWT is merely a token that contains base64 encoded JSON.
Why we need JSON Web Token?
HTTP is a stateless protocol that means a new request does not remember anything about the previous one. 
So for each request, you need to login and authenticate yourself 

2-> 1st solution ->session:
A session is an object stored on the server that helps the user to stay logged in
or to save any reference to their account. 
how session works and problem with the session:
First, the user submits a username and a password that are authenticated by the server.
If the authentication is successful a session ID is generated for the respective client. 
The generated session ID is returned to the client and is stored on the server-side as well.
Now, the client just needs to send its session ID along with the request to authenticate itself 
and retrieve necessary information. The server will then check if the session ID is valid or not. 
If the session is still valid, it will respond with the requested webpage/data. And if not, 
the server will respond with an error message stating that the request made is unauthorized
the problem with session : because it needs to store the all session in database too ,
in the memeory if not db then the server can recoive lots of api req whihc van burden the server if needs to more scaled up

3->Sessions vs Cookies:
->cookie is a small piece of data that a server sends to a user's web browser. 
The browser stores this cookie and sends it back to the server with each request.
Cookies can be used to store session information or JWT tokens.
->session :
A session represents the period during which a user is logged in. Sessions store user-specific data on the server.
Traditionally, sessions are maintained using session cookies, where the server generates a session ID, stores it in a cookie, 
and sends it to the client.
With JWT, the session information is stored inside the token itself (on the client side) rather than on the server.


4->Base64:
>Base64 encoding is a popular method used to encode binary data,
particularly when this data needs to be stored or 
transferred over media designed to manage text. 
Its primary function is to ensure that the encoded data remains intact,
 without modification during transport. 
->The Base64 encoding process involves the conversion of binary data into
 a set of 64 different characters - A-Z, a-z, 0-9, +, and / are the standard set.
These characters represent the data in an ASCII string format, making it safer
for transport over systems designed for text. For example, in the Base64 scheme,
 the word Man is encoded as TWFu. The letters M, a, and n are stored as 
the bytes 77, 97, 110, which are equivalent to binary representations 01001101, 01100001, and 01101110. 
These three bytes are joined in a 24-bit buffer producing a binary sequence. Groups of 6 bits are converted into 4 numbers (24 = 4 * 6 bits),
which are then converted into their corresponding Base64 values.
Base64 encoding: SGVsbG8gd29ybGQh==
Base64 URL encoding: SGVsbG8gd29ybGQh
Notice that in the URL-safe version, the = padding is removed, and no unsafe characters are used.

5->JWT STRUCTURE:
->header:
he JWT header contains metadata about a JWT, including the key identifier, what algorithm was used to sign in and other information.
runn this :echo 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImY1ODg5MGQxOSJ9'|base64 -d
we get this json object:
{"alg":"HS256","typ":"JWT","kid":"f58890d19"}%   
1->HS256 indicates that the JWT was signed with a symmetric algorithm, specifically HMAC using SHA-256.
2->type of JWT teels the type of jwt,if the 
JWT conforms to RFC 9068, it may have the value at+JWT indicating it is an access token.
3->the kid ->this kid value indicates what key was used to signin the jwt
Symmetric Key (One Key for Both)
One key is used for both signing and verifying the JWT.
It's like using the same key to lock and unlock a door.
The same secret key is shared between the parties who need to sign and verify the JWT.
Asymmetric Key (Two Different Keys)
Two keys are used: one for signing (private key) and one for verifying (public key).
It's like using two keys: one to lock (private key) and another to unlock (public key).

->Token Body:
The payload, or body, is where things get interesting. This section contains the data that 
this JWT was created to transport. If the JWT, for instance, represents a user authorized to 
access certain data or functionality, the payload contains user data such as roles or other authorization info.
->echo 'eyJhdWQiOiI4NWEwMzg2Ny1kY2NmLTQ4ODItYWRkZS0xYTc5YWVlYzUwZGYiLCJleHAiOjE2NDQ4ODQxODUsImlhdCI6MTY0NDg4MDU4NSwiaXNzIjoiYWNtZS5jb20iLCJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJqdGkiOiIzZGQ2NDM0ZC03OWE5LTRkMTUtOThiNS03YjUxZGJiMmNkMzEiLCJhdXRoZW50aWNhdGlvblR5cGUiOiJQQVNTV09SRCIsImVtYWlsIjoiYWRtaW5AZnVzaW9uYXV0aC5pbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhcHBsaWNhdGlvbklkIjoiODVhMDM4NjctZGNjZi00ODgyLWFkZGUtMWE3OWFlZWM1MGRmIiwicm9sZXMiOlsiY2VvIl19' |base64 -d
{
  "aud": "85a03867-dccf-4882-adde-1a79aeec50df",
  "exp": 1644884185,
  "iat": 1644880585,
  "iss": "acme.com",
  "sub": "00000000-0000-0000-0000-000000000001",
  "jti": "3dd6434d-79a9-4d15-98b5-7b51dbb2cd31",
  "authenticationType": "PASSWORD",
  "email": "admin@fusionauth.io",
  "email_verified": true,
  "applicationId": "85a03867-dccf-4882-adde-1a79aeec50df",
  "roles": [
    "ceo"
  ]
}
  ->the above are some standard and non standard claims
  ->there are aslo few claims like verify claims :
  iss,aud,nbf,exp->these claims should be verify 
  iss->this claim identifies the issuer  of the jwt,it doesnt matter what string it is 
  the comsumer and issuer should agree on the certain values
  aud:this defines the audience of the token who should consume the token
  exp and nbf: these claims detemrine the timeframe for which time the token should be valid

The JWT signature:
->To create the signature part, you need to take the encoded header,
 encoded payload, a secret, and the algorithm specified in the header, 
 then sign that with the secret. The signature is used to verify that the
  sender of the JWT is who it says it is and to ensure that the message wasn’t changed along the way.
  the whole process of making a signaure:
  ->the header is turned into base64 URL encoded string
  ->the payload is turned into base64 URL encoded string
  ->then both string concatenated with .
  ->then the strings are run through the algorithm with the key 
  ->the signautre is base64 URL encoded ,then signauture is also epneded to the string with . seprator
  ->To create the signature, the Base64-encoded header and payload are taken, along with a secret, 
  and signed with the algorithm specified in the header.
  ->HMACSHA256(
      base64UrlEncode(header) + "." +
      base64UrlEncode(payload),
      secret)


  6->JWT storage:
  Jwts can be sent in the HTTP headers,stored in cookies,and paced 
  in form parameters
  ->for cookies in browser->the length is 4096 bytes
  ->on http headeers: 8192 bytes

  7->the overall process
  ->the client sends the his info to the server
  ->server checks and verify,if ok then gen a JWT in the payload
  ->then jwt is signed using the secret key that server has
  ->the server sends jwt to the client 
  i)in a header
  or
  ii)in the body of the reponse
  iii)or jwt in a cookie
  ->the client sotres the jwt in cookie or in local storgae
  ->when a client again sent a req,this jwt is sent as cookie or authorization header
  ->cookie sent by the browser ,autho header sent by the client
  */
 //async handler is a utility function that wraps async functions
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
    //checking that JWT ->acess token is avialable in the cookies obj
      req.cookies?.accessToken ||
      //if toekn is not in in the cookies then it looks for in the autorixation header
      //the token is sent as the Bearer token then the Bearer is replaced 
      //only token is kept
      req.header("Authorization")?.replace("Bearer ", "");

    // console.log(token);
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
  //in the below line ,this line uses jwt libaray to verify the token
  //the verify function checks the token is valid or not and has been signed with the correct secret
  //key ->ACESS_TOKEN_SECRET ->this key is stored in the variables\
  //if the token is valid jwt.verify returns the decoded payload
  //which contains the information(cliams) stored in the token such as uer ID
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  //this takes the user id from the decoded token and queries the db
  //to find that user
  //.select ->selects the user data but not the sensitive info like password and 
  //refresh token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
 //if the user is successfully found ,the data excluding password and 
 //refresh token is attached to the req object under req.user
    req.user = user;
    //this function is used to pass the control to the next middleware
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
