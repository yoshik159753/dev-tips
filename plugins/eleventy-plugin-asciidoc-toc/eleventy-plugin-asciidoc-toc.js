
/**
 * Eleventy Plugin for AsciiDoc TOC Generation
 *
 * AsciiDocのHTML構造（sect1/sect2/sect3クラス）に対応したTOC生成プラグイン
 * eleventy-plugin-tocと同等の機能を提供しますが、AsciiDocの<div>ネスト構造を
 * 正しく認識して階層的なTOCを生成します。
 */

const cheerio = require('cheerio');

/**
 * デフォルトオプション
 */
const defaultOptions = {
  tags: ['h2', 'h3', 'h4'],  // 対象とする見出しタグ
  wrapper: 'nav',             // ラッパー要素
  wrapperClass: 'toc',        // ラッパーのクラス名
  ul: false,                  // true: <ul>を使用, false: <ol>を使用
  flat: false                 // true: フラット, false: 階層構造
};

/**
 * AsciiDocのセクションクラスから階層レベルを取得
 * @param {string} className - クラス名（例: "sect1", "sect2"）
 * @returns {number} - 階層レベル（1, 2, 3...）
 */
const getSectionLevel = (className) => {
  const match = className.match(/sect(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * AsciiDocの構造から見出しを抽出
 * @param {cheerio.CheerioAPI} $ - cheerioインスタンス
 * @param {object} options - オプション
 * @returns {Array} - 見出しの配列
 */
const extractHeadings = ($, options) => {
  const headings = [];
  const tagSelector = options.tags.map(tag => `${tag}[id]`).join(', ');

  // sect1, sect2, sect3 のセクションを走査
  const processSection = (sectionEl, parentPath = []) => {
    const $section = $(sectionEl);
    const sectionClasses = $section.attr('class') || '';
    const level = getSectionLevel(sectionClasses);

    if (level === 0) return;

    // このセクション内の直接の見出しを探す
    const heading = $section.children(options.tags.join(', ')).first();

    if (heading.length && heading.attr('id')) {
      const headingData = {
        id: heading.attr('id'),
        text: heading.text().replace(/\s*#\s*$/, '').trim(),
        level: level,
        tag: heading.prop('tagName').toLowerCase(),
        children: []
      };

      headings.push(headingData);

      // 子セクションを再帰的に処理
      const childSections = $section.find(`> .sectionbody > div[class*="sect"]`);
      childSections.each((i, childSection) => {
        processSection(childSection, [...parentPath, headingData]);
      });
    }
  };

  // sect1 から開始
  $('.sect1').each((i, section) => {
    processSection(section);
  });

  return headings;
};

/**
 * 階層構造を構築
 * @param {Array} headings - フラットな見出しの配列
 * @returns {Array} - 階層構造の見出し配列
 */
const buildHierarchy = (headings) => {
  const root = [];
  const stack = [];

  headings.forEach(heading => {
    const newHeading = { ...heading, children: [] };

    // 現在のレベルより深い要素をスタックから削除
    while (stack.length > 0 && stack[stack.length - 1].level >= newHeading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // ルートレベル
      root.push(newHeading);
    } else {
      // 親の子として追加
      stack[stack.length - 1].children.push(newHeading);
    }

    stack.push(newHeading);
  });

  return root;
};

/**
 * TOCのHTMLを生成
 * @param {Array} headings - 階層構造の見出し配列
 * @param {object} options - オプション
 * @returns {string} - 生成されたHTML
 */
const generateTocHtml = (headings, options) => {
  if (headings.length === 0) return '';

  const listTag = options.ul ? 'ul' : 'ol';

  const buildList = (items) => {
    if (items.length === 0) return '';

    const listItems = items.map(item => {
      let html = `<li><a href="#${item.id}">${item.text}</a>`;

      if (!options.flat && item.children && item.children.length > 0) {
        html += buildList(item.children);
      }

      html += '</li>';
      return html;
    }).join('');

    return `<${listTag}>${listItems}</${listTag}>`;
  };

  let html = buildList(headings);

  // ラッパー要素で囲む
  if (options.wrapper) {
    const classAttr = options.wrapperClass ? ` class="${options.wrapperClass}"` : '';
    html = `<${options.wrapper}${classAttr}>${html}</${options.wrapper}>`;
  }

  return html;
};

/**
 * フラット構造のTOCを生成
 * @param {Array} headings - 見出しの配列
 * @param {object} options - オプション
 * @returns {string} - 生成されたHTML
 */
const generateFlatTocHtml = (headings, options) => {
  if (headings.length === 0) return '';

  const listTag = options.ul ? 'ul' : 'ol';

  // 再帰的にすべての見出しをフラットに展開
  const flattenHeadings = (items) => {
    let result = [];
    items.forEach(item => {
      result.push(item);
      if (item.children && item.children.length > 0) {
        result = result.concat(flattenHeadings(item.children));
      }
    });
    return result;
  };

  const allHeadings = flattenHeadings(headings);

  const listItems = allHeadings.map(item =>
    `<li><a href="#${item.id}">${item.text}</a></li>`
  ).join('');

  let html = `<${listTag}>${listItems}</${listTag}>`;

  // ラッパー要素で囲む
  if (options.wrapper) {
    const classAttr = options.wrapperClass ? ` class="${options.wrapperClass}"` : '';
    html = `<${options.wrapper}${classAttr}>${html}</${options.wrapper}>`;
  }

  return html;
};

/**
 * メインのフィルタ関数
 * @param {string} content - HTMLコンテンツ
 * @param {object} userOptions - ユーザー指定のオプション
 * @returns {string} - 生成されたTOC HTML
 */
const asciidocTocFilter = (content, userOptions = {}) => {
  // オプションをマージ
  const options = { ...defaultOptions, ...userOptions };

  // HTMLを解析
  const $ = cheerio.load(content);

  // 見出しを抽出
  const headings = extractHeadings($, options);

  if (headings.length === 0) {
    return undefined; // TOCが生成できない場合はundefinedを返す
  }

  // 階層構造を構築
  const hierarchicalHeadings = buildHierarchy(headings);

  // HTMLを生成
  if (options.flat) {
    return generateFlatTocHtml(hierarchicalHeadings, options);
  } else {
    return generateTocHtml(hierarchicalHeadings, options);
  }
};

/**
 * Eleventyプラグインとしてエクスポート
 */
module.exports = function(eleventyConfig, userOptions = {}) {
  const options = { ...defaultOptions, ...userOptions };

  // フィルタを登録
  eleventyConfig.addFilter('asciidocToc', (content, filterOptions) => {
    // フィルタ呼び出し時のオプションをマージ
    let mergedOptions = { ...options };

    if (typeof filterOptions === 'string') {
      // JSON文字列として渡された場合
      try {
        const parsedOptions = JSON.parse(filterOptions);
        mergedOptions = { ...mergedOptions, ...parsedOptions };
      } catch (e) {
        console.error('Failed to parse asciidocToc options:', e);
      }
    } else if (typeof filterOptions === 'object') {
      mergedOptions = { ...mergedOptions, ...filterOptions };
    }

    return asciidocTocFilter(content, mergedOptions);
  });
};
