const z = require("zod");

const movieSchema = z.object({
  title: z.string({
    required_error: "Title is required",
    invalid_type_error: "Movie title must be a string",
  }),
  year: z.number().int().min(1900).max(2022),
  director: z.string(),
  duration: z.number().int().positive(),
  rate: z.number().min(0).max(10).default(3),
  poster: z.string().url({
    message: "Poster must be a valid URL",
  }),
  genre: z.array(
    z.enum([
      "Action",
      "Adventure",
      "Drama",
      "Fantasy",
      "Sci-Fi",
      "Crime",
      "Romance",
      "Animation",
      "Biography",
    ]),
    {
      required_error: "Movie Genre is require",
      invalid_type_error: "Movie genre must be a array of enum Genre",
    },
  ),
});

function validateMovie(object) {
  return movieSchema.safeParse(object);
}

function validatePartialMovie(object) {
  return movieSchema.partial().safeParse(object);
}

module.exports = { validateMovie, validatePartialMovie };
