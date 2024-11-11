module.exports = {
  createMoment:
    "INSERT INTO moments (title, description, category, ispublic, photo, user_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
  updateMoment:
    "UPDATE  moments SET title = $1, description = $2, category = $3, ispublic = $4, photo = $5 WHERE user_id = $6 AND moment_id = $7 RETURNING moment_id",
  getAllMoments:
    "SELECT m.moment_id, m.title, m.description, m.category, m.ispublic, m.photo, COALESCE(f.is_favourite, false) AS is_favourite, ARRAY_AGG(t.name) AS tags, COALESCE(l.no_of_likes, 0) AS total_likes, COALESCE(l.liked_by, array[]::TEXT[]) AS liked_by, m.created_at, m.updated_at FROM moments m LEFT JOIN moment_tags mt ON m.moment_id = mt.moment_id LEFT JOIN tags t ON mt.tag_id = t.tag_id LEFT JOIN favourites f ON m.moment_id = f.moment_id AND f.user_id = $1 LEFT JOIN (SELECT moment_id, COUNT(*) AS no_of_likes, ARRAY_AGG(u.user_name) AS liked_by FROM likes l INNER JOIN users u ON l.user_id = u.user_id GROUP BY moment_id) l ON m.moment_id = l.moment_id WHERE m.user_id = 1 GROUP BY m.moment_id, m.title, m.description, m.category, m.ispublic, m.photo, f.is_favourite, l.no_of_likes, l.liked_by, m.created_at, m.updated_at;",
  getSingleMoment:
    "SELECT m.moment_id, m.title, m.description, m.category, m.ispublic, m.photo, ARRAY_AGG(t.name) AS tags, m.created_at, m.updated_at FROM moments m INNER JOIN moment_tags mt ON m.moment_id = mt.moment_id INNER JOIN tags t ON mt.tag_id = t.tag_id WHERE m.user_id = $1 AND m.moment_id = $2 GROUP BY m.moment_id",
  deleteMoments:
    "DELETE FROM moments WHERE user_id = $1 AND moment_id = ANY($2)",
  checkIfMomentExists:
    "SELECT * from moments where title = $1 AND user_id = $2 ",
  checkExistingTagForUser:
    "SELECT tag_id from tags WHERE user_id = $1 AND name = $2",
  insertNewTag:
    "INSERT INTO tags (user_id, name) VALUES($1, $2) RETURNING tag_id",
  insertMomentTag: "INSERT INTO moment_tags (moment_id, tag_id) VALUES($1, $2)",
  checkIfTagAssociatedWithMoment:
    "SELECT * FROM moment_tags WHERE moment_id = $1 AND tag_id = $2",
  insertFavourite:
    "INSERT INTO favourites (user_id, moment_id, is_favourite) VALUES($1, $2, $3)",
  favouriteExists:
    "SELECT * FROM favourites WHERE user_id = $1 AND moment_id = $2",
  updateFavourite:
    "UPDATE favourites SET is_favourite = $1 WHERE user_id = $2 AND moment_id = $3",
  deleteFavourite:
    "DELETE FROM favourites WHERE user_id = $1 AND moment_id = $2",
  getAllPublicMomentsOfAllUsers:
    "SELECT m.user_id, u.user_name, m.moment_id, m.title, m.description, m.category, m.ispublic, m.photo, ARRAY_AGG(DISTINCT t.name) AS tags, COALESCE(l.no_of_likes, 0) AS total_likes, COALESCE(l.liked_by, array[]::TEXT[]) AS liked_by, m.created_at, m.updated_at FROM moments m INNER JOIN users u ON m.user_id = u.user_id INNER JOIN moment_tags mt ON m.moment_id = mt.moment_id INNER JOIN tags t ON mt.tag_id = t.tag_id LEFT JOIN (SELECT moment_id, COUNT(*) AS no_of_likes, array_agg(u.user_name) AS liked_by FROM likes l INNER JOIN users u ON l.user_id = u.user_id GROUP BY moment_id) l ON m.moment_id = l.moment_id WHERE m.ispublic = true GROUP BY m.moment_id, u.user_name, m.user_id, m.title, m.description, m.category, m.ispublic, m.photo, m.created_at, m.updated_at, l.no_of_likes, l.liked_by",
  getAllPublicMomentsOfSpecificlUser:
    "SELECT m.user_id, u.user_name, m.moment_id, m.title, m.description, m.category, m.ispublic, m.photo, ARRAY_AGG(t.name) AS tags, m.created_at, m.updated_at FROM moments m INNER JOIN users u ON m.user_id = u.user_id INNER JOIN moment_tags mt ON m.moment_id = mt.moment_id INNER JOIN tags t ON mt.tag_id = t.tag_id WHERE m.user_id = $1 AND m.ispublic = true GROUP BY m.moment_id, u.user_name",
  likeMoment:
    "INSERT INTO likes (user_id, moment_id) VALUES($1, $2) ON CONFLICT(user_id, moment_id) DO NOTHING",
  getAllLikedMomentsOfUser:
    " SELECT l.user_id, moment_id, u.user_name, COUNT(*) AS no_of_likes from likes l INNER JOIN users u on l.user_id = u.user_id WHERE u.user_id = $1 GROUP BY moment_id, l.user_id, u.user_name",
  unlikeMoment: "DELETE FROM likes WHERE user_id = $1 AND moment_id = $2",
};
