import deepClone from 'deep-clone';

export default function reducer (_state, action) {
  const state = _state ? deepClone(_state) : {};
  switch (action.type) {
    case 'POSTS_LOADED':
      state.total = action.total;
      if (!state.articles) state.articles = {};
      action.articles.forEach((article) => {
        state.articles[article.name] = article;
      });
      state.sorted = Object.keys(state.articles).sort((a, b) => {
        const aa = state.articles[a];
        const ab = state.articles[b];
        return new Date(ab.date) - new Date(aa.date);
      });
      state.doneLoading = state.total === state.sorted.total;
      break;
  }
  return state;
}
