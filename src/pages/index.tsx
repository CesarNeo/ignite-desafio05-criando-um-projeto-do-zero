import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { ReactElement } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import Link from 'next/link';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): ReactElement {
  const { next_page, results } = postsPagination;

  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState(!!next_page);

  async function handleLoadMorePosts(): Promise<void> {
    const loadMorePostsResponse: ApiSearchResponse = await (
      await fetch(next_page)
    ).json();

    setPosts(oldPosts => [...oldPosts, ...loadMorePostsResponse.results]);
    setNextPage(!!loadMorePostsResponse.next_page);
  }

  return (
    <>
      <Head>
        <title> Home | spacetraveling </title>
      </Head>

      <main className={styles.homeContainer}>
        <div className={styles.homeContent}>
          <img src="/images/Logo.svg" alt="logo" />

          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid} passHref>
              <div className={styles.homePostsContent}>
                <h1>
                  <a>{post.data.title}</a>
                </h1>
                <p>{post.data.subtitle}</p>

                <footer>
                  <span>
                    <FiCalendar />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>
                  <span>
                    <FiUser />
                    {post.data.author}
                  </span>
                </footer>
              </div>
            </Link>
          ))}

          {nextPage && (
            <button type="button" onClick={handleLoadMorePosts}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsPagination = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  return {
    props: {
      postsPagination,
    },
  };
};
