import { Movie, Review, Reviewer } from "../shared/types";

export const movies: Movie[] = [
  {
    movieId: 1234,
    title: "The Shawshank Redemption",
    date: "1995-03-01",
    overview: "A banker convicted of uxoricide forms a friendship over a quarter century with a hardened convict.",
  },
  {
    movieId: 5678,
    title: "The Godfather",
    date: "1972-03-24",
    overview: "The aging patriarch of an organized crime dynasty transfers control to his reluctant son.",
  },
];

export const reviewers: Reviewer[] = [
  { reviewerId: "jbloggs@here.com", name: "Joe Bloggs" },
  { reviewerId: "asmith@here.com", name: "Alice Smith" },
];

export const reviews: Review[] = [
  {
    movieId: 1234,
    reviewerId: "jbloggs@here.com",
    date: "1995-04-20",
    text: "Moving, brilliant, inspirational, hopeful and empowering. Outstanding performances from its ensemble cast.",
  },
  {
    movieId: 1234,
    reviewerId: "asmith@here.com",
    date: "1995-05-01",
    text: "A timeless masterpiece. The story of hope and friendship is beautifully told.",
  },
  {
    movieId: 5678,
    reviewerId: "jbloggs@here.com",
    date: "2001-06-15",
    text: "An offer you cannot refuse. Brando is mesmerizing as the patriarch.",
  },
];
