% apex-book.cls — APEX graduation book class
% Wraps `report` with conventions used across the book.

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{apex-book}[2026/05/05 APEX graduation book class]

\LoadClass[12pt,a4paper,oneside]{report}

% --- Geometry, spacing, typography ------------------------------------
\RequirePackage[a4paper,margin=2.5cm,headheight=14pt]{geometry}
\RequirePackage{setspace}
\onehalfspacing
\RequirePackage{microtype}
\RequirePackage{fontspec}
\setmainfont{Latin Modern Roman}
\setsansfont{Latin Modern Sans}
\setmonofont{Latin Modern Mono}[Scale=0.92]
\RequirePackage{ragged2e}
\RequirePackage[english]{babel}

% --- Math -------------------------------------------------------------
\RequirePackage{amsmath,amssymb}

% --- Graphics, colour, layout ----------------------------------------
\RequirePackage{graphicx}
\graphicspath{{figures/out/}{figures/screenshots/}}
\RequirePackage{xcolor}
\definecolor{apexblue}{HTML}{1F4E79}
\definecolor{apexgrey}{HTML}{555555}
\definecolor{apexlight}{HTML}{F2F4F7}

% --- Tables -----------------------------------------------------------
\RequirePackage{booktabs}
\RequirePackage{longtable}
\RequirePackage{array}
\RequirePackage{tabularx}

% --- Captions and floats ---------------------------------------------
\RequirePackage[font=small,labelfont=bf,labelsep=period]{caption}
\RequirePackage{subcaption}
\RequirePackage{float}

% --- Code listings ----------------------------------------------------
\RequirePackage{listings}
\lstdefinestyle{apex}{
  basicstyle=\ttfamily\small,
  keywordstyle=\color{apexblue}\bfseries,
  commentstyle=\color{apexgrey}\itshape,
  stringstyle=\color{apexblue!70!black},
  numbers=left,
  numberstyle=\tiny\color{apexgrey},
  numbersep=8pt,
  frame=single,
  rulecolor=\color{apexgrey!40},
  tabsize=2,
  breaklines=true,
  breakatwhitespace=true,
  showstringspaces=false,
  captionpos=b,
  xleftmargin=12pt,
  xrightmargin=4pt,
  aboveskip=8pt,
  belowskip=8pt,
}
\lstset{style=apex}
\RequirePackage[most]{tcolorbox}
\tcbset{
  apexcallout/.style={
    colback=apexlight,
    colframe=apexblue,
    arc=2pt,
    boxrule=0.6pt,
    left=8pt,right=8pt,top=4pt,bottom=4pt,
    fonttitle=\bfseries\sffamily,
  }
}

% --- Hyperlinks and cross-refs ---------------------------------------
\RequirePackage[hidelinks,bookmarks=true,bookmarksnumbered=true]{hyperref}
\RequirePackage{cleveref}

% --- Bibliography -----------------------------------------------------
\RequirePackage[backend=biber,style=ieee,sorting=none]{biblatex}

% --- Glossaries / acronyms -------------------------------------------
\RequirePackage[acronym,toc,nonumberlist]{glossaries-extra}
\setabbreviationstyle[acronym]{long-short}

% --- Header / footer --------------------------------------------------
\RequirePackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\nouppercase{\leftmark}}
\fancyhead[R]{\thepage}
\renewcommand{\headrulewidth}{0.4pt}

% --- Chapter headings -------------------------------------------------
\RequirePackage{titlesec}
\titleformat{\chapter}[display]
  {\normalfont\sffamily\Huge\bfseries\color{apexblue}}
  {\chaptertitlename\ \thechapter}{12pt}{\Huge}
\titlespacing*{\chapter}{0pt}{20pt}{20pt}

% --- Misc -------------------------------------------------------------
\RequirePackage{enumitem}
\setlist{nosep,leftmargin=*}
\RequirePackage{csquotes}
\RequirePackage{pgfplots}
\pgfplotsset{compat=1.18}

\endinput
