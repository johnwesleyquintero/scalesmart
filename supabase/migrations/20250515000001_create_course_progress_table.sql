CREATE TABLE course_progress (
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  course_id TEXT NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, course_id)
);