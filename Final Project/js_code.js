console.log('jjkyiy')
d3.csv("https://openei.org/doe-opendata/dataset/5e3b0afb-e8bb-4515-af2b-491d3e85123f/resource/8a5a465a-2b92-49e3-9e94-862d10e3f272/download/completeseds19602009.csv").then(function(data) {
  console.log(JSON.stringify(data));
});