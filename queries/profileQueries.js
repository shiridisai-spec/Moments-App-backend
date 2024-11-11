module.exports = {
  getProfileInfo:
    "SELECT user_id, user_name, user_email, user_role, profile_picture FROM users WHERE user_id = $1",
  updateProfilePicture:
    "UPDATE users SET profile_picture = $1 WHERE user_id = $2 RETURNING profile_picture",
};
