const axios = require('axios')

const GENESIS_IES_LOGIN_SERVICE_URL = process.env.GENESIS_IES_LOGIN_SERVICE_URL

const auth = async (req, res, next) => {


    try {
        const response = await axios({
            method: 'get',
            url: `${GENESIS_IES_LOGIN_SERVICE_URL}/isLogedIn`,
            headers: {'Authorization': req.headers.authorization}
        })

        if(Object.keys(response.data).includes('isLogedIn')){
            req.user = response.data.user
            next()
        }
        else{
            throw new Error()
        }
    } catch (error) {
        res.status(401).send({isLogedIn: false})
    }
    
}

module.exports = auth