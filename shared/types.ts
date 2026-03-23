export type Movie = {
  movieId: number;
  title: string;
  date: string;
  overview: string;
};

export type Reviewer = {
  reviewerId: string;
  name: string;
};

export type Review = {
  movieId: number;
  reviewerId: string;
  date: string;
  text: string;
};
