import {Container, Credits, Details, TVDetails} from "./models";
import {Item, List} from "../components";

const apiKey = `66683917a94e703e14ca150023f4ea7c`;
const listComponents = new Map();
const itemComponents = new Map();

let stage;
let genres;

listComponents.set("movie", List);
listComponents.set("tv", List);

itemComponents.set("movie", Item);
itemComponents.set("tv", Item);

export const init = (stageInstance) =>{
    stage = stageInstance;
};

export const getMovies = async()=> {
    const movies = await _getPopular("movie");
    const models = [movies];
    return _lists(models);
};

export const getSportMovies = async()=> {
    const movies = await _getSportMovies("movie");
    const models = [movies];
    return _lists(models);
};

const _getSportMovies = async(type)=> {
    if (!genres) {
        genres = await _getGenres();
    }

    return _getMovieSportsData(`/search/${type}`).then(response => {
        return new Container(response, type, genres);
    });
};

export const getTv = async()=> {
    const tv = await _getPopular("tv");
    const models = [tv];
    return _lists(models);
};

export const getDetails = async(type, id)=> {
    const itemDetails =  await _get(`/${type}/${id}`).then(response => {
        return type === "movie" ? new Details(response) : new TVDetails(response);
    });

    const credits = await _get(`/${type}/${id}/credits`).then(response => {
        return new Credits(response);
    });

    /*console.log(movieDetails)
    console.log(credits)*/

    return [itemDetails, credits]
};

export const getRuntime = async(type, id)=> {
    return await _get(`/${type}/${id}`).then(response => {
        return type === "movie" ? response.runtime : response.episode_run_time;
    });
};

const _getGenres = async()=> {
    const movie = await _get(`/genre/movie/list`).then(response => {
        return response.genres;
    });

    const tv = await _get(`/genre/tv/list`).then(response => {
        return response.genres;
    });

    return [...movie, ...tv]
};

export const setGenres = (data)=> {
    genres = data;
};

const _getPopular = async(type)=> {
    if (!genres) {
        genres = await _getGenres();
    }

    return _get(`/${type}/popular`).then(response => {
        return new Container(response, type, genres);
    });
};

const _get = (url,params)=> {
    let params_str = `?api_key=${apiKey}`;

    for (let key in params) {
        if (params.hasOwnProperty(key)) {
            params_str += "&" + key + "=" + encodeURIComponent(params[key]);
        }
    }

    return fetch(`https://api.themoviedb.org/3${url}${params_str}`, {
        'Accept': 'application/json'
    }).then(response => {
        if (!response.ok) throw "Response not ok";
        return response.json();
    }).catch(error => {
        console.error('Error loading ' + url, error);
        throw error;
    })
};

const _getMovieSportsData = (url,params)=> {
    let params_str = `?api_key=${apiKey}&query=sport&include_adult=false`;

    for (let key in params) {
        if (params.hasOwnProperty(key)) {
            params_str += "&" + key + "=" + encodeURIComponent(params[key]);
        }
    }

    console.log(`https://api.themoviedb.org/3${url}${params_str}`);

    return fetch(`https://api.themoviedb.org/3${url}${params_str}`, {
        'Accept': 'application/json'
    }).then(response => {
        if (!response.ok) throw "Response not ok";
        return response.json();
    }).catch(error => {
        console.error('Error loading ' + url, error);
        throw error;
    })
};

const _lists = (models = []) => {
    if(!Array.isArray(models)){
        models = [models];
    }
    return models.map(list => {
        return stage.c({
            type: listComponents.get(list.type),
            itemConstruct: itemComponents.get(list.type),
            items: list.items
        });
    });
};