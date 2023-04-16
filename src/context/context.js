import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';


const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext() ;
//console.log(GithubContext)
// Provider



const GithubProvider =  ({children}) =>{
    const [githubUser , setGithubUser] = useState(mockUser) ;
    const [repos , setRepos] = useState(mockRepos) ;
    const [followers,setFollowers] = useState(mockFollowers) ;
    // request loading 
    const [requests , setRequests] = useState(0) ;
    const [isLoading , setIsLoading] = useState(false) ;
    
    // Error 
    const [error,setError] = useState({show : false , msg : ""})
    

    const searchGithubUser = async(user) =>{
       toggleError();
       setIsLoading(true);
       try{
        const response = await axios(`${rootUrl}/users/${user}`)
        const {login  , followers_url} = response.data ;

        // setting up user 
        setGithubUser(response.data);

        // repos
        const r  =  axios(`${rootUrl}/users/${login}/repos?per_page=100`);      
        // followers
        const f = axios(`${followers_url}?per_page=100`) ;
        
        await Promise.allSettled([r,f])
        .then((results)=>{
            const [repos , followers] = results ;
            const status = 'fulfilled' ;
            if(repos.status === status){
                setRepos(repos.value.data);
            }
            if(followers.status === status){
                setFollowers(followers.value.data);
            }
        }).catch((err) => console.log(err));

       }catch(err){
          toggleError(true,'There is no user with that username');
          console.log(err);
       }
       checkRequests();
       setIsLoading(false);
    }


    function toggleError(show = false , msg = "" ){
        setError({show,msg})
    }
   

    // Check Rate 
    const checkRequests =()=>{
        axios(`${rootUrl}/rate_limit`)
        .then(({data}) => {
             let {
                rate : {remaining} , 
            } = data ;

            setRequests(remaining) ;
            if(remaining === 0){
                // Throw an error 
                toggleError(true , 'sorry You have exceeded your hourly rate limit');
            }
        })
        .catch((err) => console.log(err));
    }

    // Error 


    useEffect(checkRequests,[])

    return (
        <GithubContext.Provider value={{
            githubUser , 
            repos ,
            followers ,
            requests ,
            error ,
            searchGithubUser,
            isLoading
        }}>
           {children}
        </GithubContext.Provider>
    )
     
}

export {GithubContext , GithubProvider};