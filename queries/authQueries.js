module.exports = {
  checkIfEmailExists: "SELECT * FROM users where user_email = $1",
  requestResetPassword:
    "UPDATE users SET reset_token = $1, reset_token_expire = $2 WHERE user_email = $3 RETURNING user_id",
  insertNewUser:
    "INSERT INTO users (user_name, user_email, user_role, user_password) VALUES($1, $2, $3, $4) RETURNING *",
};
