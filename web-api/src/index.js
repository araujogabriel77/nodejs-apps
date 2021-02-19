const http = require('http')
const PORT = 3000
const DEFAULT_HEADER = { 'Content-Type': 'aplication/json' }
const HeroFactory = require('./factories/heroFactory')
const heroService = HeroFactory.generateInstance()
const Hero = require('./entities/hero')

const routes = {
    '/heroes:get': async (request, response) => {
        const { id } = request.queryString
        const heroes = await heroService.find(id)
        response.write(JSON.stringify({ results: heroes }))

        return response.end()
    },

    '/heroes:post': async (request, response) => {

        for await (const data of request) {
            try {
                const item = JSON.parse(data)
                const hero = new Hero(item)
                const { error, valid } = hero.isValid()

                if (!valid) {
                    response.writeHead(400, DEFAULT_HEADER)
                    response.write(JSON.stringify({ error: error.join(', ') }))
                    return response.end()
                }

                const id = await heroService.create(hero)
                response.writeHead(201, DEFAULT_HEADER)
                response.write(JSON.stringify({ success: 'User created with success!', id }))


                //só jogamos o return aqui pois sabemos que é um único objeto body por requisição
                //se fosse um arquivo, que sobe sob demanda
                //ele poderia entrar mais vezes em um mesmo evento, aí removeriamos o return daqui
                return response.end()
            } catch (error) {
                return handlerError(response)(error)
            }
        }
    },

    default: (request, response) => {
        response.write('Hello!')
        response.end()
    }
}

const handlerError = request => {
    return error => {
        console.error('Deu m***', error)
        response.writeHead(500, DEFAULT_HEADER)
        response.write(JSON.stringify({ error: 'Internal Server Error!' }))

        return response.end()
    }
}

const handler = (request, response) => {
    const { url, method } = request

    const [first, route, id] = url.split('/')

    request.queryString = { id: isNaN(id) ? id : Number(id) }

    const key = `/${route}:${method.toLowerCase()}`

    response.writeHead(200, DEFAULT_HEADER)

    const chosen = routes[key] || routes.default
    return chosen(request, response).catch(handlerError(response))
}

http.createServer(handler)
    .listen(PORT, () => console.log('server running at', PORT))