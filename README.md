# MarvelSearchEngine
A small Angular.js aplication which uses the Marvel Comics API to search for characters in the Marvel Universe.

DIRECTIONS:

After cloning the repository, simply open the "index.html" file in a web browser. I did my development using Google Chrome and the Chrome Developer Tools. I have also tested the application in Firefox.

NOTE: There are some bugs with the API I have come across in my development and testing of the application. These errors return the same results when I use the Interactive Docs (https://developer.marvel.com/docs) which leads me to believe they are issues with the API and not with my application.

- If you try to search for the character "Wolverine", the API will not find it. I am using the nameStartsWith option to search for characters, so that a user can enter partial names and get results. If the search is done with name="Wolverine" it can find the record.
- Sometimes, strings will return with errors from the API. For example, sometimes "Iron Man" will return with an API error, while other times it will find results. The strings "ir", "iro", "iron" seem to always return with errors for some reason
- It appears that sometimes the API will return mislabelled and/or redundant URLs. For example, if I search "X-Men" the result contains data for all possible (3) URLs; detail, wiki, and comiclink. However, the response has the same URL for the detail and comiclink URLs (they both are the link to the comics).
