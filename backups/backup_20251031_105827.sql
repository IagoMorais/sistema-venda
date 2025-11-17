--
-- PostgreSQL database dump
--

\restrict 0kYJ425ALQ1CojIumlTESDfhrwgLZNGDxqIvdkyqkkRIfSWAW2VoYMZscKJDJqK

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 18.0 (Ubuntu 18.0-1.pgdg24.04+3)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    price_at_time numeric(10,2) NOT NULL,
    station text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_items_station_check CHECK ((station = ANY (ARRAY['kitchen'::text, 'bar'::text]))),
    CONSTRAINT order_items_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'preparing'::text, 'ready'::text, 'delivered'::text])))
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    table_number text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    total_amount numeric(10,2),
    payment_method text,
    waiter_id integer,
    cashier_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    closed_at timestamp without time zone,
    CONSTRAINT orders_payment_method_check CHECK ((payment_method = ANY (ARRAY['cash'::text, 'credit'::text, 'debit'::text, 'pix'::text]))),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['open'::text, 'paid'::text, 'cancelled'::text])))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    brand text NOT NULL,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    min_stock_level integer NOT NULL,
    imageurl text,
    discount numeric(5,2) DEFAULT 0 NOT NULL,
    created_by integer,
    station text DEFAULT 'kitchen'::text NOT NULL,
    CONSTRAINT products_station_check CHECK ((station = ANY (ARRAY['kitchen'::text, 'bar'::text])))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'waiter'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'waiter'::text, 'cashier'::text, 'kitchen'::text, 'bar'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, quantity, price_at_time, station, status, created_at) FROM stdin;
1	1	4	1	1.00	kitchen	ready	2025-10-31 04:34:58.422392
2	2	4	1	1.00	kitchen	ready	2025-10-31 13:52:00.176285
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, table_number, status, total_amount, payment_method, waiter_id, cashier_id, created_at, closed_at) FROM stdin;
1	10	open	1.00	\N	19	\N	2025-10-31 04:34:58.422392	\N
2	10	paid	1.00	pix	19	20	2025-10-31 13:52:00.176285	2025-10-31 13:55:32.408
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, brand, price, quantity, min_stock_level, imageurl, discount, created_by, station) FROM stdin;
4	coca	coca	1.00	11	1	\N	0.00	1	kitchen
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (sid, sess, expire) FROM stdin;
MPHWrr7stDDdVF746PJtQRQbBJdlSYlU	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T13:54:18.592Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":20}}	2025-11-07 13:58:14
JaQUKz-kFeLQ9C4VBtPC5BnoHIx170zS	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T15:54:21.534Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 15:54:22
KmkI3-f772aA6Dr_dlhxpDKzI12Enyom	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:13:54.784Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 04:13:56
noaV6Z1SCf4FM3uvcEPM9dVuVSFz-TVJ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T15:55:29.575Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 15:55:30
QQn4rqxyiNvp6LaJwzUsotDGvRQMw5dB	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T15:51:44.806Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 15:51:46
f20W1rczKgMsFi1L41ExiH6loSnRasSf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T15:55:29.594Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 15:55:30
slBa9PwJTyK98mcHAyT_-H1AYUNUUskp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T16:00:48.441Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 16:00:49
avy0hbwJWypWlYdU4gMnWYZNAcgqdP40	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T15:52:43.644Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 15:52:44
KNAHxlBYUGvwTj24npSua0trC68u3c9v	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T15:53:28.336Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 15:53:29
KfhbTkNers61oLhGXAyNktdFDnbZTIVs	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T15:54:21.506Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 15:54:22
Y0I1eO6QZ89LEViF6BUbI9qU5B8ZA6X4	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T15:54:21.590Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 15:54:22
MLZBMUzKthKg6x1H6bbAw-8oYOGIZjni	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T15:55:29.523Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 15:55:30
Zq6-mGdN4aIZzMHdYE47jPehbhdrxrr5	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T03:34:34.738Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 03:34:35
8uUGLye7wl6U8Xi5euEivRrTldPi1oRH	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T15:53:28.352Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 15:53:29
nP9T7zb2NeSMNxVuG5XLoYkjooWm5imD	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T15:53:28.318Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 15:53:29
cNxsO8kg9gaaOmbdzlG7kPl2q6N-B5hx	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T16:01:42.515Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 16:01:43
qblxhc8rQmVvSDuFMJ1sV12NiKuqwx7S	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T03:34:34.716Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 03:34:35
lPk0DNO_w5DrPkqzWDxrDqCEVk-U28aX	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T03:34:34.775Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 03:34:36
qJaYqrf7qD1Y18u3UJYSnP9O7GDOS3la	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T16:01:42.463Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 16:01:43
ERWZR-iBNlAv7jlNer9ZmJyA87nspzT7	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T16:01:42.409Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 16:01:43
Kn5MKfcBSnz9QF9wsY9jzTiotQAqvK5K	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T16:00:48.529Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 16:00:49
xwNaVAOqYJyzjCjH14LS6pbo0cjcrbRi	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T16:00:48.463Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 16:00:49
CDGsrlCC4o98NvNmB6WLgOUbm4jtbLtZ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:14:45.228Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 04:14:46
-txpXuYqWOMVDDjI8-pYZLU3lTtEebfM	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T19:30:02.572Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 19:30:03
sUoY8TPxDw3lDXVEsz1ywC_dxH8X6Awp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T19:31:16.486Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 19:31:17
9e2yYA9SwYgF_1nz5zpo1R-IyL3BAN80	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T19:31:16.486Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 19:31:17
WTj0p9O5YQu66HSOY94-6Rh0iJuAVvZp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-06T19:31:16.552Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-06 19:31:17
htdgYfHX8gF3Fdv2C6onwZSVJbqJLdGT	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:13:54.781Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 04:13:55
o6Z9JeM1o-K9z25IaesVNEKWQ-e2R1NV	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:13:54.789Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 04:13:55
yg6xWmte39luBTMX_j2t-_rUqCn5bawm	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:14:45.244Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 04:14:46
Vl30DvlvSc7Fw7wocEo_kTkzQZyjXi-x	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:19:51.782Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 04:19:52
CyYjCJLdfUv0RkOL-eQR3hrFvLQ760_G	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:14:45.255Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 04:14:46
OIrXyaNt85KcubraT4h3_kmcN4ojpvEt	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:19:51.730Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 04:19:52
kXigJixxTJ-iAK8pHQOKGMjTWXAYxftD	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:19:51.697Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 04:19:53
6_3X5a9sW_IKhFjPo4GdJLsf22E5QMv3	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:33:51.725Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":18}}	2025-11-07 13:58:06
Fmn6yNvZHimB6jXtNddofa3bs-mCSLMa	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:30:27.628Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-11-07 13:55:46
0sIfpB7U1mzbR3Wj9cAxUIjcLZZ1j1hZ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T13:51:44.868Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":19}}	2025-11-07 13:57:22
GMBkIbwtwrZN5lSGJifeyF_m0XrYvQiu	{"cookie":{"originalMaxAge":604800000,"expires":"2025-11-07T04:34:48.066Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":19}}	2025-11-07 04:41:29
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, role, created_at) FROM stdin;
1	admin	c4af81372a2c3c51a0f4b1e7283a823cfada45af05fe60666f6a40fb4aa3f373a6612f26c2d6daccd406edf49e56a84efc243f48a5d6aa8dc036a96828ba0181.11f92c03c61a2122b42646c5c56350cd	admin	2025-10-31 04:19:51.2405
4	waiter	866ec8f58aae2b977ee6594900f406d9d70c5ca75826822d964b4e9bab8d7772680d0421200c32ec97d2131dfe165f0663baff143d33f5b1dce9dbb2c3251f84.c84077abe38291654dfd415626284dd7	waiter	2025-10-31 04:19:51.335662
7	cashier	883c8696d34cb6d154db9a0f37e10d3a8a9223c402743ae258a7f64c6108a561e692816f4601a1394b9228c196db5af11e0c95ec2605d77e4c4dfe194eb9662c.f41bf3d3206eacde08800c950e2b5e13	cashier	2025-10-31 04:19:51.421903
10	kitchen	38b4f798619b41840c8f746e2cc10435a8d7d9ed9e0e697acb1b0505224973b6fe80a0b49d4448d63c2e25ad0b5d948b9e431423698d24a486fba86a4e089107.fdaa0e16c9ef6cb040cbf5939dcb11df	kitchen	2025-10-31 04:19:51.49878
13	bar	08e17873d9c054f39962047bcb98b6d8e8b4b6f114dae6d6db35950ab016785d6fe779ecd435b70320e1139aeaa0dc75b32928ae576d2542cb4a73328a09c79a.161f5a37663ff53947c170948c9b0399	bar	2025-10-31 04:19:51.5744
18	morais	95b8c000068545b821e88c11bdfea28197ea6f6387ea08c4e769a90f84377f0bbf4d1237c9ecc9935e414c33e50179e792f05bcc7228d9cfd0b951ebc8918c34.82c5c3d6f9cda108b49bafda84c9e4a1	kitchen	2025-10-31 04:33:47.676058
19	sda	4f3a13c42b75fd339d863437697ca95814c105f5281217e71b71b80a599a89e6bb01276900cfff93188f8feed9e6930b486e13bd674d9cda738f984f131f6de9.b6146e2fe2269106ffbb9f52c8733c16	waiter	2025-10-31 04:34:37.834492
20	iago123	df97adcee14ba952478a6adac8e3cd21c9cbaeaebe4dddf23e2dfa8f8e8b7dee1428cf6d319d969892ca969ddd796a8cb57d36b0f5848ff4c32d059349f80d44.2f67cab24b44faa72e3e785a9680aa57	cashier	2025-10-31 13:53:31.787039
\.


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 2, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 2, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 20, true);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: order_items_station_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_items_station_status_idx ON public.order_items USING btree (station, status);


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(id);


--
-- Name: orders orders_waiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_waiter_id_fkey FOREIGN KEY (waiter_id) REFERENCES public.users(id);


--
-- Name: products products_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 0kYJ425ALQ1CojIumlTESDfhrwgLZNGDxqIvdkyqkkRIfSWAW2VoYMZscKJDJqK

