% apex-ieee.cls — APEX graduation book, IEEE documentation conventions.
% A `report`-based book class (chapters supported) styled to IEEE referencing
% and typographic conventions: Times-family body font, IEEE numeric citations
% (biblatex/biber, style=ieee), "Fig." figure labels, single-column layout that
% accommodates code listings, wide tables, and TikZ/pgfplots graphics.
%
% Engine: XeLaTeX (fontspec).  Build: latexmk -xelatex (see latexmkrc).

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{apex-ieee}[2026/07/01 APEX IEEE-style graduation book class]

\LoadClass[11pt,a4paper,oneside]{book}

% --- Geometry, spacing, typography -----------------------------------
\RequirePackage[a4paper,margin=2.4cm,headheight=15pt]{geometry}
\RequirePackage{setspace}
\onehalfspacing
\RequirePackage{microtype}

\RequirePackage{fontspec}
% Times-family (IEEE body) via TeX Gyre Termes; Heros-like sans; Inconsolata mono.
\setmainfont{TeX Gyre Termes}
\setsansfont{TeX Gyre Heros}[Scale=0.92]
\setmonofont{TeX Gyre Cursor}[Scale=0.90]

\RequirePackage[english]{babel}
\RequirePackage{xurl}
% Gentle line-breaking tolerance so inline code identifiers rarely overflow.
\setlength{\emergencystretch}{4em}
\tolerance=2000
\hbadness=4000

% --- Math -------------------------------------------------------------
\RequirePackage{amsmath,amssymb}

% --- Graphics, colour, layout ----------------------------------------
\RequirePackage{graphicx}
\graphicspath{{figures/}{figures/screenshots/}{figures/tikz/}}
% Cap every \includegraphics so no figure overflows the text block.
\makeatletter
\def\maxwidth{\ifdim\Gin@nat@width>\linewidth\linewidth\else\Gin@nat@width\fi}
\def\maxheight{\ifdim\Gin@nat@height>0.72\textheight 0.72\textheight\else\Gin@nat@height\fi}
\makeatother
\setkeys{Gin}{width=\maxwidth,height=\maxheight,keepaspectratio}

\RequirePackage{xcolor}
\definecolor{apexblue}{HTML}{1F4E79}   % IEEE-ish deep blue
\definecolor{apexcyan}{HTML}{2E6E9E}
\definecolor{apexgrey}{HTML}{555555}
\definecolor{apexlight}{HTML}{EEF2F7}
\definecolor{apexgreen}{HTML}{2E7D32}
\definecolor{apexred}{HTML}{B3261E}
\definecolor{apexamber}{HTML}{B26A00}

% --- Tables -----------------------------------------------------------
\RequirePackage{booktabs}
\RequirePackage{longtable}
\RequirePackage{array}
\RequirePackage{tabularx}
\RequirePackage{xltabular}
\RequirePackage{multirow}
\newcolumntype{L}[1]{>{\raggedright\arraybackslash}p{#1}}
\newcolumntype{C}[1]{>{\centering\arraybackslash}p{#1}}

% --- Captions and floats (IEEE: "Fig.", caption below figures) -------
\RequirePackage[font=small,labelfont=bf,labelsep=period]{caption}
\RequirePackage{subcaption}
\RequirePackage{float}
\renewcommand{\figurename}{Fig.}

% --- Code listings ----------------------------------------------------
\RequirePackage{listings}
\lstdefinestyle{apex}{
  basicstyle=\ttfamily\footnotesize,
  keywordstyle=\color{apexblue}\bfseries,
  commentstyle=\color{apexgrey}\itshape,
  stringstyle=\color{apexgreen!70!black},
  numbers=left,
  numberstyle=\tiny\color{apexgrey},
  numbersep=8pt,
  frame=single,
  rulecolor=\color{apexgrey!40},
  tabsize=2,
  breaklines=true,
  breakatwhitespace=false,
  postbreak=\mbox{\textcolor{apexgrey}{$\hookrightarrow$}\space},
  showstringspaces=false,
  captionpos=b,
  xleftmargin=14pt,
  xrightmargin=4pt,
  aboveskip=8pt,
  belowskip=8pt,
  literate={`}{{\textasciigrave}}1,
}
\lstset{style=apex}
% Convenience language aliases used across chapters.
\lstdefinelanguage{Go}{
  morekeywords={func,package,import,var,const,type,struct,interface,map,chan,go,defer,
    return,if,else,for,range,switch,case,default,break,continue,nil,true,false,
    string,int,uint,int64,float64,bool,byte,error,make,append,len,cap},
  morecomment=[l]{//},
  morecomment=[s]{/*}{*/},
  morestring=[b]",
  morestring=[b]`,
  sensitive=true,
}
\lstdefinelanguage{TypeScript}{
  morekeywords={const,let,var,function,return,if,else,for,while,switch,case,default,
    break,continue,import,export,from,as,type,interface,extends,implements,class,
    new,async,await,yield,try,catch,finally,throw,typeof,instanceof,null,undefined,
    true,false,void,never,unknown,any,string,number,boolean,readonly,public,private},
  morecomment=[l]{//},
  morecomment=[s]{/*}{*/},
  morestring=[b]",
  morestring=[b]',
  morestring=[b]`,
  sensitive=true,
}

\RequirePackage[most]{tcolorbox}
\newtcolorbox{apexcallout}[1][]{
  colback=apexlight, colframe=apexblue, arc=2pt, boxrule=0.6pt,
  left=8pt, right=8pt, top=4pt, bottom=4pt,
  fonttitle=\bfseries\sffamily, #1
}

% --- Hyperlinks and cross-refs ---------------------------------------
\RequirePackage[hidelinks,bookmarks=true,bookmarksnumbered=true]{hyperref}
\hypersetup{pdfborder={0 0 0}}
\RequirePackage[capitalise,nameinlink]{cleveref}
\crefname{listing}{Listing}{Listings}
\Crefname{listing}{Listing}{Listings}

% --- Bibliography (IEEE numeric, biber) ------------------------------
\RequirePackage[backend=biber,style=ieee,sorting=none]{biblatex}

% --- Header / footer --------------------------------------------------
\RequirePackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\small\nouppercase{\leftmark}}
\fancyhead[R]{\small\thepage}
\renewcommand{\headrulewidth}{0.4pt}
\fancypagestyle{plain}{\fancyhf{}\fancyfoot[C]{\small\thepage}\renewcommand{\headrulewidth}{0pt}}

% --- Chapter / section headings (IEEE-flavoured) ---------------------
\RequirePackage{titlesec}
\titleformat{\chapter}[display]
  {\normalfont\sffamily\Huge\bfseries\color{apexblue}}
  {\chaptertitlename\ \thechapter}{10pt}{\Huge}
\titlespacing*{\chapter}{0pt}{12pt}{18pt}
\titleformat{\section}
  {\normalfont\sffamily\large\bfseries\color{apexblue}}{\thesection}{0.6em}{}
\titleformat{\subsection}
  {\normalfont\sffamily\normalsize\bfseries\color{apexcyan}}{\thesubsection}{0.6em}{}

% --- Misc -------------------------------------------------------------
\RequirePackage{enumitem}
\setlist{nosep,leftmargin=1.4em}
\RequirePackage{csquotes}

% --- TikZ / pgfplots --------------------------------------------------
\RequirePackage{tikz}
\usetikzlibrary{positioning,arrows.meta,shapes.geometric,fit,calc,backgrounds,
  chains,shadows.blur,decorations.pathreplacing,matrix,shapes.multipart}
\RequirePackage{pgfplots}
\pgfplotsset{compat=1.18}
\RequirePackage{pgfgantt}

% Reusable TikZ node styles for architecture/flow diagrams.
\tikzset{
  apexbox/.style={draw=apexblue, fill=apexlight, rounded corners=2pt,
    align=center, font=\sffamily\small, minimum height=9mm, minimum width=22mm,
    inner sep=4pt},
  apexstore/.style={draw=apexgreen!70!black, fill=apexgreen!8, rounded corners=2pt,
    align=center, font=\sffamily\small, minimum height=9mm, minimum width=22mm},
  apexext/.style={draw=apexamber, fill=apexamber!10, rounded corners=2pt,
    align=center, font=\sffamily\small, minimum height=9mm, minimum width=22mm},
  apexarrow/.style={-{Latex[length=2.4mm]}, draw=apexgrey, thick},
  apexarrowblue/.style={-{Latex[length=2.4mm]}, draw=apexblue, thick},
  apexlabel/.style={font=\sffamily\scriptsize\itshape, fill=white, inner sep=1pt},
}

\endinput
