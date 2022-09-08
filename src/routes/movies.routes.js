const { Router } = require("express")


const MoviesController = require("../controllers/MoviesController")
const moviesRouter = Router()

const moviesController = new MoviesController()

moviesRouter.post("/", moviesController.create)
moviesRouter.get("/:id", moviesController.show)
moviesRouter.delete("/", moviesController.delete)
moviesRouter.get("/", moviesController.index)

module.exports = moviesRouter