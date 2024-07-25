import axios from 'axios';

const axiosConfig = {
    IP:'localhost',
    PORT:5912
}

export const loadConfig = async () => {
    try{
        console.log('loading config');
        const res = await axios.get('/env');
        Object.assign(axiosConfig, res.data);
    }catch(e){
        console.log(e);
    }
}


export default axiosConfig;

