import jwt from "jsonwebtoken";

export const requireSignin = async (req, res, next) => {
  //middleware to check if the user is logged in or not
  try {
    //try to decode the token
    const decoded = jwt.verify(
      //verify the token using the secret key and get the user data from the token
      req.headers.authorization, //get the token from the header
      process.env.JWT_SECRET //get the secret key from the environment variable
    );
    req.user = decoded; // if the token is valid, set the user in the request object
    next(); //call the next middleware
  } catch (err) {
    console.log("Error in requireSignin:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
// middleware/auth
export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.role.includes("Admin")) {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }
    next();
  } catch (err) {
    console.error("isAdmin middleware error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// apply isAdmin middleware in routes followed by requireSignin
