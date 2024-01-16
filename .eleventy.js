module.exports = function (eleventyConfig) {
	eleventyConfig.addFilter('readableDate', dateObj => {
		return new Date(dateObj).toLocaleDateString('en-uk', { month: 'short', day: 'numeric', year: 'numeric' });
  });

	eleventyConfig.addCollection("blog", collectionApi => {
    return collectionApi.getFilteredByGlob("src/blog/*.md").sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  });

  return {
  	dir: {
   		input: 'src',
      output: '_site',
      data: 'data',
      layouts: 'layouts',
      includes: 'include',
    },
  }
}
