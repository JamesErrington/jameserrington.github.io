module.exports = function (eleventyConfig) {
	eleventyConfig.addFilter("readableDate", dateObj => {
		return new Date(dateObj).toLocaleDateString("en-uk", { month: "short", day: "numeric", year: "numeric" });
  });

	eleventyConfig.addFilter('pageTags', tags => {
    const generalTags = ["all", "nav", "post", "posts"];

    return tags
      .toString()
      .split(",")
      .filter(tag => !generalTags.includes(tag));
  });

	eleventyConfig.addCollection("blog", collectionApi => {
    return collectionApi.getFilteredByGlob("src/blog/**/*.md").sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  });

	eleventyConfig.addCollection("tags", collectionApi => {
		const tagSet = new Set();
		for (const item of collectionApi.getAll()) {
			if ('tags' in item.data) {
				for (const tag of item.data.tags) {
					tagSet.add(tag);
				}
			}
		}

		return Array.from(tagSet);
	});

	eleventyConfig.addPassthroughCopy("src/img");

  return {
  	dir: {
   		input: "src",
      output: "_site",
      data: "data",
      layouts: "layouts",
      includes: "include",
    },
    passthroughFileCopy: true,
  }
}
