Something we did for school. Gives cool results sometimes.

Project uses N-gram and Tf-Idf vectorizaton to compare similarity between files and to find plagiarism. To be exact, because of the nature of n-gram, application compares forms. It is not semantic. Which that means it needs less hardware to run and can run in cpu. But it can only detect the exact parts being similar. General comparison yields interesting reuslts.
Project is language-agnostic but it definitely would work better in some lanugages. In case of Turkish, words needs to reduced to the rooted for a more meaningful comparison. If, you aim for plagiarism detection. For comparing forms and style, it's good enough. 
  
There is a lot of possible optimization and features. Current version eats memory raw, doesn't read some files properly. It doesnt have a real corpus, makes from the files. That should give lower values for normally rare terms in the language but not rare in the files, and lower the similarity score. Should be added. 
Some files are written Turkish parts, will change those to English but idk when.

-baykemal
