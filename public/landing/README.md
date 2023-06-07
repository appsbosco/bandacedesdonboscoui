# Jane - HTML

This is a personal portfolio template built using [Tailwind CSS](https://tailwindcss.com) and designed by Tailwind Awesome.

## Getting started

Unzip and open the folder of the theme with your editor of choice.

We have shipped this template using the Tailwind CLI tool in order to get you up and running as fast as possible.

If you would like to setup a development environment with hot reloading, first ensure that Node.js & npm are installed. This theme uses the latest version of Tailwind: `tailwindcss v3.3`.

First, install the dependencies by navigating to the project directory in your terminal and run

```bash
npm install
# or
yarn install  # if you have Yarn installed
```

This will install all the required dependencies and place them in a folder called `node_modules` in the root directory.

We have added the compiled CSS file to the `<head>` of all the template's HTML files so if you want to rebuild Tailwind’s utility classes to style your content, you simply run the Tailwind CLI tool to scan your template files for classes and rebuild your CSS. We have wrapped the Tailwind CLI tool in a npm script, that way you can do this by running the following command in your terminal:

```
npm run dev
```

This will run the Tailwind CLI in watch mode, that way the `build/css/main.css` file will rebuild everytime you make changes to your HTML files. You can also run

```
npm run build
```

to build your CSS for production and minify your stylesheet.

## Tailwind CSS

This theme is built on top of the Tailwind CSS framework which is installed via npm and used via the Tailwind CLI tool as recommended by the offical Tailwind installation docs (https://tailwindcss.com/docs/installation). If you are not familiar with the Tailwind CSS framework I would recommend you check out the [Tailwind documentation](https://tailwindcss.com/docs).

The entrypoint css file is located at `src/css/tailwind.css`. This file contains the `@tailwind` directives and any additional css used in the template. It also imports the `prism.css` stylesheet for `prism.js` in order to style the code blocks used in the blog posts.

We've tried to minimize any custom CSS and only rely on Tailwind's utility classes and a few additional classes defined within the `tailwind.config.js` file. This template additionally uses 4 official Tailwind plugin (`@tailwindcss/forms`, `@tailwindcss/aspect-ratio`, `@tailwindcss/line-clamp`, `@tailwindcss/typography`).

## Build directory

The bulk of the code is located in the `build` directory. Here you will find all of the `html` files at the root of the directory. the images (`build/images`), and the CSS build file after running the Tailwind CLI tool (`build/css/main.css`).

## Javascript

As for JavaScript we use the following third party packages:

- [Alpine.js](https://alpinejs.dev/) for the mobile navigation, dropdown, hamburger menu, and Testimonials carousel progress bar. We have installed Alpine.js by including its CDN in a `<script>` tag in in the head of our HTML pages.
- [Swiper.js](https://swiperjs.com) for the testimonials carousel in the home page. The package and its corresponding stylesheet is installed via CDN and only included in the home page.
- [Prism.js](https://prismjs.com/) - a lightweight, extensible syntax highlighterfor used for styling code blocks in our blog posts.

## Font

This template uses the following Google fonts:

- [Inter](https://fonts.google.com/specimen/Inter)
- [Lexend](https://fonts.google.com/specimen/Lexend)
- [Gochi Hand](https://fonts.google.com/specimen/Gochi+Hand)

## Icons

The icons used for this theme are part of the [Hero Icons](https://heroicons.com/) set that are free to use and published under the [MIT License](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE).

Some of the examples in Jane use [Nucleo App](https://nucleoapp.com/premium-icons) icons which we have acquired a license for. You are free to use the Nucleo icons included in this template on your projects, but if you are interested in using the rest of their premium icons you can buy a license on their [website](https://nucleoapp.com/).

## Images

All of the images used in the template are free to use and are either from [Unsplash](https://unsplash.com/), [Pexels](https://www.pexels.com/), or custom-made.

## License

This site template is a commercial product and is licensed under the [Tailwind Awesome license](https://www.tailwindawesome.com/license).

## Additional Help

If you need additional help setting up the template or have any questions, feel free to contact us at <rodrigo@tailwindawesome.com>.
