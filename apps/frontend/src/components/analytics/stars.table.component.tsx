import {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { UtcToLocalDateRender } from '@gitroom/react/helpers/utc.date.render';
import { Button } from '@gitroom/react/form/button';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import ReactLoading from 'react-loading';
import interClass from '@gitroom/react/helpers/inter.font';

export const UpDown: FC<{ name: string; param: string }> = (props) => {
  const { name, param } = props;
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo(() => {
    const newName = searchParams?.get('key');
    const newState = searchParams?.get('state');

    if (newName !== param) {
      return 'none';
    }

    return newState as 'asc' | 'desc';
  }, [searchParams, name, param]);

  const changeStateUrl = useCallback(
    (newState: string) => {
      const query =
        newState === 'none' ? `` : `?key=${param}&state=${newState}`;
      router.replace(`/analytics${query}`);
    },
    [router, param]
  );

  const changeState = useCallback(() => {
    changeStateUrl(
      state === 'none' ? 'desc' : state === 'desc' ? 'asc' : 'none'
    );
  }, [changeStateUrl, state]);

  return (
    <div
      className="flex gap-[5px] items-center select-none"
      onClick={changeState}
    >
      <div>{name}</div>
      <div className="flex flex-col gap-[3px]">
        {['none', 'asc'].includes(state) && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="9"
            height="4"
            viewBox="0 0 22 12"
            fill="none"
          >
            <path
              d="M21.9245 11.3823C21.8489 11.5651 21.7207 11.7213 21.5563 11.8312C21.3919 11.9411 21.1986 11.9998 21.0008 11.9998H1.00079C0.802892 12 0.609399 11.9414 0.444805 11.8315C0.280212 11.7217 0.151917 11.5654 0.076165 11.3826C0.000412494 11.1998 -0.0193921 10.9986 0.0192583 10.8045C0.0579087 10.6104 0.153276 10.4322 0.293288 10.2923L10.2933 0.29231C10.3862 0.199333 10.4964 0.125575 10.6178 0.0752506C10.7392 0.0249263 10.8694 -0.000976562 11.0008 -0.000976562C11.1322 -0.000976562 11.2623 0.0249263 11.3837 0.0752506C11.5051 0.125575 11.6154 0.199333 11.7083 0.29231L21.7083 10.2923C21.8481 10.4322 21.9433 10.6105 21.9818 10.8045C22.0202 10.9985 22.0003 11.1996 21.9245 11.3823Z"
              fill="#94A3B8"
            />
          </svg>
        )}
        {['none', 'desc'].includes(state) && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="9"
            height="4"
            viewBox="0 0 22 12"
            fill="none"
            className="rotate-180"
          >
            <path
              d="M21.9245 11.3823C21.8489 11.5651 21.7207 11.7213 21.5563 11.8312C21.3919 11.9411 21.1986 11.9998 21.0008 11.9998H1.00079C0.802892 12 0.609399 11.9414 0.444805 11.8315C0.280212 11.7217 0.151917 11.5654 0.076165 11.3826C0.000412494 11.1998 -0.0193921 10.9986 0.0192583 10.8045C0.0579087 10.6104 0.153276 10.4322 0.293288 10.2923L10.2933 0.29231C10.3862 0.199333 10.4964 0.125575 10.6178 0.0752506C10.7392 0.0249263 10.8694 -0.000976562 11.0008 -0.000976562C11.1322 -0.000976562 11.2623 0.0249263 11.3837 0.0752506C11.5051 0.125575 11.6154 0.199333 11.7083 0.29231L21.7083 10.2923C21.8481 10.4322 21.9433 10.6105 21.9818 10.8045C22.0202 10.9985 22.0003 11.1996 21.9245 11.3823Z"
              fill="#94A3B8"
            />
          </svg>
        )}
      </div>
    </div>
  );
};

export const StarsTableComponent = () => {
  const fetch = useFetch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = +(searchParams?.get('page') || 1);
  const key = searchParams?.get('key');
  const state = searchParams?.get('state');
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const starsCallback = useCallback(
    async (path: string) => {
      startTransition(() => setLoading(true));

      const data = await (
        await fetch(path, {
          body: JSON.stringify({
            page,
            ...(key && state ? { key, state } : {}),
          }),
          method: 'POST',
        })
      ).json();

      startTransition(() => setLoading(false));

      return data;
    },
    [fetch, page, key, state]
  );

  const {
    isLoading: isLoadingStars,
    data: stars,
    mutate,
  } = useSWR('/analytics/stars', starsCallback, {
    revalidateOnMount: false,
    revalidateOnReconnect: false,
    revalidateOnFocus: false,
    refreshWhenHidden: false,
    revalidateIfStale: false,
  });

  useEffect(() => {
    mutate();
  }, [mutate, searchParams]);

  const renderMediaLink = useCallback((date: string) => {
    const local = dayjs.utc(date).local();
    const weekNumber = local.isoWeek();
    const year = local.year();
    return `/launches?week=${weekNumber}&year=${year}`;
  }, []);

  const changePage = useCallback(
    (type: 'increase' | 'decrease') => () => {
      const newPage = type === 'increase' ? page + 1 : page - 1;
      const keyAndState = key && state ? `&key=${key}&state=${state}` : '';
      router.replace(`/analytics?page=${newPage}${keyAndState}`);
    },
    [router, page, key, state]
  );

  return (
    <div className="flex flex-1 flex-col gap-[15px] min-h-[426px]">
      <div className="text-textColor flex gap-[8px] items-center select-none">
        <div
          onClick={changePage('decrease')}
          className={clsx(
            (page === 1 || loading) && 'opacity-50 pointer-events-none'
          )}
        >
          {/* Left Arrow */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13.1644 15.5866...Z" fill="#E9E9F1" />
          </svg>
        </div>
        <h2 className="text-[24px]">Stars per day</h2>
        <div
          onClick={changePage('increase')}
          className={clsx(
            !isLoadingStars && (loading || stars?.stars?.length < 10) && 'opacity-50 pointer-events-none'
          )}
        >
          {/* Right Arrow */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M14.4137 10.6633...Z" fill="#E9E9F1" />
          </svg>
        </div>
        <div>{loading && <ReactLoading type="spin" color="#fff" width={20} height={20} />}</div>
      </div>

      <div className="flex-1 bg-secondary">
        {stars?.stars?.length ? (
          <table className={`table1 ${interClass}`}>
            <thead>
              <tr>
                <th><UpDown name="Repository" param="login" /></th>
                <th><UpDown name="Date" param="date" /></th>
                <th><UpDown name="Total Stars" param="totalStars" /></th>
                <th><UpDown name="Total Fork" param="totalForks" /></th>
                <th><UpDown name="Stars" param="stars" /></th>
                <th><UpDown name="Forks" param="forks" /></th>
                <th>Media</th>
              </tr>
            </thead>
            <tbody>
              {stars.stars.map((p: any) => (
                <tr key={p.date}>
                  <td>{p.login}</td>
                  <td><UtcToLocalDateRender date={p.date} format="DD/MM/YYYY" /></td>
                  <td>{p.totalStars}</td>
                  <td>{p.totalForks}</td>
                  <td>{p.stars}</td>
                  <td>{p.forks}</td>
                  <td>
                    <Link href={renderMediaLink(p.date)}>
                      <Button>Check Launch</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-[24px] px-[16px]">
            Load your GitHub repository from settings to see analytics
          </div>
        )}
      </div>
    </div>
  );
};
