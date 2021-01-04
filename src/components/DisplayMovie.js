import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";

import { useAuthState } from "react-firebase-hooks/auth";
import firebase from "../firebase.js";
import { db } from "../firebase.js";

import { SmallButton } from "./common/SmallButton.js";

const List = styled.ul`
  margin: 1rem 1rem;
  list-style: none;
`;

const Item = styled.li`
  border-left: 2px solid black;
  margin: 1rem 0;
  padding-left: 7px;
  font-size: 1.2rem;
  font-weight: 400;

  display: flex;
  justify-content: space-between;
`;

function DisplayMovie({ movieTitle, setMyNoms, setTitle }) {
  const [showResult, updateShowResult] = useState(false);
  const [resMovie, setMovie] = useState([]);
  const [user] = useAuthState(firebase.auth());

  //gets data from axios, and checks if has already been nominated and add that as a obj key
  useEffect(() => {
    updateShowResult(false);

    let goodRes = false;

    async function getData() {
      const res = await axios.get(
        `http://www.omdbapi.com/?apikey=${process.env.REACT_APP_OMDB_KEY}&s=${movieTitle}`
      );
      if (res.data.Response === "True") {
        for (let i = 0; i < res.data.Search.length; i++) {
          const mid = res.data.Search[i].imdbID;
          const dataRef = db.collection("allNoms").where("imdbID", "==", mid);
          const querySnapshot = await dataRef.get();
          if (!querySnapshot.empty) {
            res.data.Search[i].isNom = true;
          } else {
            res.data.Search[i].isNom = false;
          }
        }
        setMovie(res.data.Search);
        goodRes = true;
      }
    }

    getData().then(() => updateShowResult(goodRes));
  }, [movieTitle]);

  //add nominations; only adds to allNoms as by setting state, will trigger ShortList to update the user specific document
  function addMovie(e) {
    const temp = e.target.parentNode.textContent;
    const targetMovie = temp.split(" (")[0];

    for (let i = 0; i < resMovie.length; i++) {
      if (targetMovie === resMovie[i].Title) {
        resMovie[i].uid = user ? user.uid : "Guest";

        db.collection("allNoms")
          .add({
            imdbID: resMovie[i].imdbID,
            movies: resMovie[i],
          })
          .catch((err) => console.log(err));

        setMyNoms((prev) => [...prev, resMovie[i]]);
        setTitle("");

        break;
      }
    }
  }

  return (
    <List>
      {showResult ? (
        resMovie.map((movie, index) => {
          return (
            <Item key={index}>
              {movie.Title} ({movie.Year})
              {movie.isNom ? null : (
                <SmallButton
                  mColor={(props) => props.theme.tchColor}
                  hColor={(props) => props.theme.tchColor}
                  onClick={addMovie}
                >
                  Nominate
                </SmallButton>
              )}
            </Item>
          );
        })
      ) : (
        <li>Results Pending...</li>
      )}
    </List>
  );
}

export default DisplayMovie;
