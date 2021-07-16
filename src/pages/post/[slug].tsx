import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { ReactElement } from 'react';
import { useRouter } from 'next/router';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const amountWordsOfBody = RichText.asText(
    post.data.content.reduce((acc, data) => [...acc, ...data.body], [])
  ).split(' ').length;

  const amountWordsOfHeading = post.data.content.reduce((acc, data) => {
    if (data.heading) {
      return [...acc, ...data.heading.split(' ')];
    }

    return [...acc];
  }, []).length;

  const readingTime = Math.ceil(
    (amountWordsOfBody + amountWordsOfHeading) / 200
  );

  return (
    <main className={styles.postContainer}>
      <Header />

      {post.data.banner.url && (
        <section className={styles.banner}>
          <img src={post.data.banner.url} alt="Banner" />
        </section>
      )}

      <div className={styles.postContent}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>

          <div className={styles.postInfo}>
            <span>
              <FiCalendar size={20} color="#BBBBBB" />
              {format(parseISO(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>

            <span>
              <FiUser size={20} color="#BBBBBB" />
              {post.data.author}
            </span>

            <span>
              <FiClock size={20} color="#BBBBBB" />
              {readingTime} min
            </span>
          </div>

          <div>
            {post.data.content.map(({ heading, body }) => (
              <div key={heading}>
                {heading && <h2>{heading}</h2>}

                <div
                  className={styles.postSection}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
                />
              </div>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    { pageSize: 1 }
  );

  const paths = posts.results.map(result => {
    return {
      params: {
        slug: result.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const uid = context.params.slug;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(uid), {});

  return {
    props: {
      post: response,
    },
  };
};
