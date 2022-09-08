const { hash, compare } = require("bcryptjs")
const AppError = require("../utils/AppError")
const knex = require("../database/knex")

class UsersController {
    async create(request, response) {
        const { name, email, password } = request.body
        const checkUsersExists = await knex("users").where({ email }).first()

        if (checkUsersExists) {
            throw new AppError("Este email ja foi utilizado")
        }

        const hashedPassword = await hash(password, 8)
        
        await knex("users").insert({name , email, password: hashedPassword})

        return response.status(201).json()
    }

    async update(request, response) {
        const { name, email, password, old_password} = request.body
        const { id } = request.params

        const user = await knex("users").where({ id }).first()

        if(!user) {
            throw new AppError("Usuário não cadastrado")
        }

        const userWithUpdatedEmail = await knex("users").where({ email }).first()

        if(userWithUpdatedEmail && userWithUpdatedEmail.id != user.id) {
            throw new AppError("Email já esta em uso")
        }

        if(password && !old_password) {
            throw new AppError("Voce precisa informar a senha antiga para definir uma nova senha")
        }

        if(!password && old_password) {
            throw new AppError("Digite a senha atual")
        }

        if(password && old_password) {
            const checkOldPassword = await compare(old_password, user.password)

            if(!checkOldPassword) {
                throw new AppError("Senha digitada não corresponde a senha antiga")
            }

            user.password = await hash(password, 8)
        }



        user.name = name
        user.email = email

        await knex("users")
        .where({ id })
        .update({name: user.name, email: user.email, password: user.password, updated_at: knex.fn.now()})
        
        
        return response.status(200).json()
    }
}

module.exports = UsersController