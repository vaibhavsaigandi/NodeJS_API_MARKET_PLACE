import { randomBytes, pbkdf2 } from "crypto";

export const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(32).toString("hex");
    //pbkdf2 algorithm for hashing with 1000 iterations , 64 length , sha512 hashing
    pbkdf2(password, salt, 1000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
};

export const comparePassword = (password, hashed) => {
  return new Promise((resolve, reject) => {
    const [salt, key] = hashed.split(":");
    pbkdf2(password, salt, 1000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
};

// Explanation
// 1. hashPassword Function:
// Purpose: To securely hash the input password.
// Steps:
// Generate a random salt using randomBytes(32).toString("hex").
// Use PBKDF2 (Password-Based Key Derivation Function 2) to hash the password with the salt:
// Parameters:
// password: The plain-text password.
// salt: The salt for added security.
// iterations: Number of iterations (e.g., 10,000 for security).
// keyLength: Length of the derived key (64 bytes here).
// digest: Hashing algorithm (sha512 in this case).
// Combine the salt and hash into a single string (salt:hash) for storage.
// 2. comparePassword Function:
// Purpose: To verify if a given password matches the stored hash.
// Steps:
// Split the stored hash into salt and hash using hashedPassword.split(":").
// Recompute the hash for the given password using the same salt.
// Compare the recomputed hash with the original hash to determine if they match.
