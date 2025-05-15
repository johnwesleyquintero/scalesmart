CREATE TABLE module_progress (
  user_id bigint REFERENCES auth.users(id) NOT NULL,
  course_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, course_id, module_id)
);