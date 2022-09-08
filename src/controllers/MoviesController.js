const AppError = require("../utils/AppError")
const knex = require("../database/knex")

class MoviesController {

    async create(request, response) {
        const { title, description, rating, tags } = request.body

        const { user_id } = request.query

        if(rating < 1 || rating > 5 ) {
            throw new AppError("Valor de invalido, avaliação permitida de 1 a 5")
        }

        const note_id = await knex("movie_notes").insert({
            title,
            description,
            rating,
            user_id
        })

        const tagsInsert = tags.map( tag => {
            return{
                note_id,
                user_id,
                name: tag
            }
        })

        await knex("movie_tags").insert(tagsInsert)



        return response.status(201).json()

    }

    async show(request, response) {
        const { id } = request.params

        const note = await knex("movie_notes").where({ id }).first()
        const tags = await knex("movie_tags").where({ note_id: id }).orderBy("name")

        if(!note) {
            throw new AppError("Nenhuma nota cadastrada")
        }

        return response.status(200).json({
            ...note,
            tags
        })
    }

    async delete(request, response){
        const { id } = request.query

        const noteExists = await knex("movie_notes").where({ id }).first()


        if(!noteExists) {
            throw new AppError("Nota não encontrada")
        }

        await knex("movie_notes").where({ id }).delete()

        return response.status(200).json()

    }

    async index(request, response) {
        const { user_id, title, tags } = request.query

        let notes

        if(tags && title) {

            notes = await knex("movie_notes").where({ user_id }).whereLike("title", `%${title}%`).orderBy("title")

            const filterTags = tags.split(",").map( tag => tag.trim())

            notes.includes(filterTags)


        } else if(tags) {

            const filterTags = tags.split(",").map( tag => tag.trim())

            notes = await knex("movie_tags")
            .select([
                "movie_notes.id",
                "movie_notes.title",
                "movie_notes.description",
                "movie_notes.rating",
                "movie_notes.user_id",
                "movie_notes.created_at",
                "movie_notes.updated_at"
            ])
            .where("movie_notes.user_id", user_id)
            .whereIn("name", filterTags)
            .innerJoin("movie_notes", "movie_notes.id", "movie_tags.note_id")

        } else if(!tags && title) {
            notes = await knex("movie_notes").where({ user_id }).whereLike("title", `%${title}%`).orderBy("title")

        } else {
            notes = await knex("movie_notes").where({ user_id })

        }

        const userTags = await knex("movie_tags").where({ user_id })
        const notesWithTags = notes.map( note => {
            const noteTags= userTags.filter( tag => tag.note_id === note.id)

            return {
                ...note,
                noteTags
            }
        })


        return response.status(200).json(notesWithTags)

    }
}

module.exports = MoviesController