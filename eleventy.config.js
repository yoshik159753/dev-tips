const eleventyAsciidoc = require("eleventy-plugin-asciidoc");
const pluginTOC = require("./plugins/eleventy-plugin-asciidoc-toc/eleventy-plugin-asciidoc-toc");

module.exports = function(eleventyConfig) {

  // Asciidoctor プラグインを登録します
  eleventyConfig.addPlugin(eleventyAsciidoc, {
    // 'include' を有効にするため、セーフモードを unsafe に変更する
    safe: 'unsafe',
    // (オプション) Asciidoctor に渡す属性などを指定できます
    attributes: {
      // セクションアンカーを表示する
      'sectanchors': true
    }
  });
  // (オプション) Asciidoc ファイルを Eleventy のテンプレートとして明示的に認識させます
  eleventyConfig.addTemplateFormats("adoc");
  // (オプション) node_module 配下にある Asciidoctor の css をコピーする
  eleventyConfig.addPassthroughCopy({
    "node_modules/@asciidoctor/core/dist/css/asciidoctor.css": "css/asciidoctor.css"
  });

  // 目次生成プラグインを登録します
  eleventyConfig.addPlugin(pluginTOC, {
    // 目次に含める見出しタグを指定
    tags: ['h2', 'h3', 'h4'],
    // 目次全体を囲むラッパータグを指定 (デフォルトは 'nav')
    wrapper: '',
    // ラッパーに適用するクラス名 (デフォルトは 'toc')
    wrapperClass: '',
    // true にすると <ol> ではなく <ul> を使う (デフォルトは false)
    ul: true,
    // true にすると階層構造を無視してフラットなリストにする (デフォルトは false)
    flat: false
  });

  // html に変換しないコンポーネントを格納するディレクトリ
  eleventyConfig.setIncludesDirectory("_includes");

  // 設定を返します
  return {
    // 入力ディレクトリ (デフォルトは ".")
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
