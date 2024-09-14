import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
/* The concepts related to the acess and refresh token :
1->acess token : these topken are short lived when user logins and it get gets 
acess to the token which is acess token the then it sends back to the 
cliejt browser .
lifetime: it typically lives for minutes to hours ,once expired no longer able to usable

2->Refresh token :
  a refrsh token is used to obtain new acess token ,without wanted the user to neter the details 
  of the user agian
  when the acess token expires then the  client sends the refrsh token 
 tot he server to get a new acess token ,so it maintains the user session
 lifetime: the lifeteme is possibly tot he days to months

3->example:
Example:
When the user’s 15-minute access token expires in the e-commerce app, the app can use the refresh token
 (which might be valid for 1 month) to request a new access token without requiring the user to log in again. 
  
 4-> How they work together:
 ->user login get the both tokens
 ->the acess token is used for each API call ,if the token is valid then server process the request
 ->when the acess token expires the client needs new  one,so in that time
 ->the client sends the refresh token to the server to get the new acess token
 ->if user wants to logout the refrehs topken can be revoked
 */

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    //the generateAcccessRefreshTokens function accepts the user id as the
    //argument and then check in the database if the user if already exists
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // The newly generated refresh token is stored in the user's record in the database.
    // This allows the server to validate the refresh token later when the user requests a new access token
    user.refreshToken = refreshToken;
    // This saves the user’s updated information (with the new refresh token) to the database.
    //. The { validateBeforeSave: false } option skips schema validation (if any) during saving, which can be useful for
    //performance or when validations are not required in this specific step.
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  //console.log("email: ", email);

  if (
    // This line checks whether any of the fields (fullName, email, username, password)
    // are empty or contain only whitespace.
    // he some() method checks if at least one of the fields
    //meets the condition field?.trim() === "", meaning it checks if any field is either undefined, null, or an empty string after trimming.
    //field?.trim() uses optional chaining (?.) to prevent errors if a field is null or undefined.
    //trim() removes any leading or trailing whitespace from the input.
    //If the user leaves the email or username blank, the error will be thrown, indicating all fields are required.

    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //This query checks the database to see if a user already exists with either the same username or email.
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //console.log(req.files);
  //req.files->conatinas the uploaded files
  //avatar[0]->refers to the first line in the array if there are multiple files uploaded
  //?.->if the there is no avatar the code wont throw any error
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //if the file is uplaoded its local path will be stored in avatarlocalpath
  let coverImageLocalPath;
  if (
    //check is req.files contains any uploaded files
    req.files &&
    //req.files->This is the object that holds files uploaded by the user, typically when using a library like Multer in Node.js.
    //req.files.coverImage->this will check that file used for uploading the file is named coverImage
    //so this will hold the files associated with the field
    //Array.isArray-> is a built in method used to determine if a given value is an array
    //if its an array then return true
    //the uploade difles are represneted as an array
    //y. This allows the system to handle cases where multiple files are uploaded at once.
    // Therefore, you want to check if the file data (like req.files.coverImage) is indeed an array before you try to access any elements in it.
    /*
    correct:
     req.files = {
     coverImage: [
     { path: "path/to/file1.jpg" },
     ]
     };
    wrong:

     req.files = {
     coverImage: "path/to/file1.jpg" // Not an array!
     };
   ->only wants to acess the fisrt file in the array
    */
    Array.isArray(req.files.coverImage) &&
    //check if atleast one cover image file was uploaded
    req.files.coverImage.length > 0
  ) {
    //is extracting the file path of the first uploaded cover
    // image and storing it in the variable coverImageLocalPath.
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { email, username, password } = req.body;
  console.log(email);

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {

    //when http is set to true meaning the cookied can not be modiefied from the client browser
    httpOnly: true,
    //meanign only cookie sent to only HTTPS connection ,not the HTTP to make it secure
    secure: true,
  };
 
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
    /*the logout flow:
    1->delte the refreshToken from the db
    2->clear the refreshtoken and acesstoken from the client browser
    3->sent the reponse telling that user is logged out */
  await User.findByIdAndUpdate(
    //User is the 'Model User' its the mongodb one 
    //all function or quieries performed on mongodb are goes throuh the model
    //getting user id from the req
    
    req.user._id,
    {
        //unset -> is the mongodb operator which is used to remove a field 
        //from the acct
        //the refreshToken is field is being removed from the user record in the db
        //meaning user will no longer have stored refresh token stored \//so logging out the user on the server side
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    //the below option int he findByIdUpdate rnsures that the function returns
    //the updated user document
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});
//asyncHandler: a wrapper function that simplifies 
//handling asynchronous code in Express.js. It catches any errors
// inside async functions and passes them to the error handler middleware, 
//so you don’t need to use try-catch blocks everywhere.

const refreshAccessToken = asyncHandler(async (req, res) => {
    //this will check if the refrsh token is sent in th cookie or not in the req obj
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
//if not then through an error with the unauthorized request
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
 //the 
  try {
    //verifying yhe token using jwt libary
    //to ensure that the token has not been tampered
    //IncomingRefrshToken is the token recived from the client
    const decodedToken = jwt.verify(
      incomingRefreshToken,

      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
//if (incomingRefreshToken !== user?.refreshToken): Checks  
//if the refresh token sent by the client doesn’t match the one stored in the database for that user.
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
  /*the flow:
  1->when a client wants to acess new token it sends a req that includes refresh token
  which can be stored either in the cookies or req body
  2->if the token is found in any of the location stored in the variable
  3->the fun will check is the client provided the a refresh token if not server will rejct the req
  4->now verifying the refresh token to check it was sent by the server or not ,this will happen using secret key
  5->if the token is valid it will return an obj
  6->the obj will conatin the payload of the token ->User Id,expiry date etc
  7->once the token is verified the server knows the user id from the decoded token
  8->baiscally const user = await User.findById(decodedToken?._id);
  this will check if the user  from the id of the decoded token exist or not
  to check that user is still exist or not and is authorize to use the system
  if the user has deleted the acct then the refresh token should be invalid 
  9-> if the user is reterived from the db and server checks if the refrsh token provided by the 
  client matches the one stored in database for that user
  10-> if both the token match then server generate new acess token and new 
  refresh token for the user
  11->the new tokens sent back to the client 
  */
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  //TODO: delete old image - assignment

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  //TODO: delete old image - assignment

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
