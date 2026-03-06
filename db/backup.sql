--
-- PostgreSQL database dump
--

\restrict 5C8DbTZpnB0pQjEUkb2RiuL1U8m60BRV8jr3qW1Yf4MT2C3zlZagYJ113XJuq7P

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    staff_id character varying(50) NOT NULL,
    staff_name character varying(100) NOT NULL,
    attendance_date date DEFAULT CURRENT_DATE,
    shift character varying(20) NOT NULL,
    status character varying(10) DEFAULT 'Absent'::character varying NOT NULL
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: inventory_product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_product (
    id integer CONSTRAINT finished_goods_inventory_id_not_null NOT NULL,
    product_name character varying(255) CONSTRAINT finished_goods_inventory_product_name_not_null NOT NULL,
    opening_stock integer DEFAULT 0,
    used_stock integer DEFAULT 0,
    closing_stock integer DEFAULT 0,
    minimum_stock_level integer DEFAULT 100,
    unit_weight_gm numeric(10,3),
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_product OWNER TO postgres;

--
-- Name: finished_goods_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.finished_goods_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finished_goods_inventory_id_seq OWNER TO postgres;

--
-- Name: finished_goods_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.finished_goods_inventory_id_seq OWNED BY public.inventory_product.id;


--
-- Name: head_attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.head_attendance (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    login_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_only date DEFAULT CURRENT_DATE
);


ALTER TABLE public.head_attendance OWNER TO postgres;

--
-- Name: head_attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.head_attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.head_attendance_id_seq OWNER TO postgres;

--
-- Name: head_attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.head_attendance_id_seq OWNED BY public.head_attendance.id;


--
-- Name: hourly_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hourly_logs (
    id integer NOT NULL,
    machine_id character varying(50),
    machine_name character varying(255),
    shift character varying(50),
    total_output integer,
    hourly_output integer,
    chiller_check boolean DEFAULT false,
    compressor_check boolean DEFAULT false,
    mould_check boolean DEFAULT false,
    machine_check boolean DEFAULT false,
    remarks text,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.hourly_logs OWNER TO postgres;

--
-- Name: hourly_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hourly_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hourly_logs_id_seq OWNER TO postgres;

--
-- Name: hourly_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hourly_logs_id_seq OWNED BY public.hourly_logs.id;


--
-- Name: inventory_colors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_colors (
    id integer NOT NULL,
    color_name text NOT NULL,
    stock_qty_kgs numeric DEFAULT 0
);


ALTER TABLE public.inventory_colors OWNER TO postgres;

--
-- Name: inventory_colors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_colors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_colors_id_seq OWNER TO postgres;

--
-- Name: inventory_colors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_colors_id_seq OWNED BY public.inventory_colors.id;


--
-- Name: inventory_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_materials (
    id integer NOT NULL,
    material_name text NOT NULL,
    opening_stock numeric(10,2) DEFAULT 0,
    used_stock numeric(10,2) DEFAULT 0,
    minimum_stock_level numeric(10,2) DEFAULT 10,
    unit character varying(20) DEFAULT 'KG'::character varying,
    closing_stock numeric(10,2) DEFAULT 0
);


ALTER TABLE public.inventory_materials OWNER TO postgres;

--
-- Name: inventory_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_materials_id_seq OWNER TO postgres;

--
-- Name: inventory_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_materials_id_seq OWNED BY public.inventory_materials.id;


--
-- Name: inventory_molds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_molds (
    id integer NOT NULL,
    mold_name text NOT NULL,
    cavity_options text
);


ALTER TABLE public.inventory_molds OWNER TO postgres;

--
-- Name: inventory_molds_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_molds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_molds_id_seq OWNER TO postgres;

--
-- Name: inventory_molds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_molds_id_seq OWNED BY public.inventory_molds.id;


--
-- Name: inventory_packing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_packing (
    id integer NOT NULL,
    item_name text NOT NULL,
    stock_qty_pcs integer DEFAULT 0
);


ALTER TABLE public.inventory_packing OWNER TO postgres;

--
-- Name: inventory_packing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_packing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_packing_id_seq OWNER TO postgres;

--
-- Name: inventory_packing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_packing_id_seq OWNED BY public.inventory_packing.id;


--
-- Name: machine_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.machine_status (
    id integer NOT NULL,
    machine_name character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'idle'::character varying,
    total_output integer DEFAULT 0,
    start_time timestamp with time zone DEFAULT now(),
    material_qty_1 character varying(255),
    shift character varying(255),
    material_type_1 character varying(255),
    mold_type character varying(255),
    cavity integer,
    material_type_2 text,
    material_qty_2 numeric DEFAULT 0,
    material_type_3 text,
    material_qty_3 numeric DEFAULT 0,
    material_type_4 text,
    material_qty_4 numeric DEFAULT 0,
    material_color text,
    color_qty numeric DEFAULT 0,
    cycle_timing integer DEFAULT 0,
    stop_reason text,
    accumulated_output integer DEFAULT 0,
    stop_time timestamp with time zone,
    hourly_units integer DEFAULT 0,
    last_report_at timestamp without time zone DEFAULT now(),
    resume_time timestamp with time zone,
    session_start_time timestamp with time zone,
    product_name character varying(255)
);


ALTER TABLE public.machine_status OWNER TO postgres;

--
-- Name: machine_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.machine_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.machine_status_id_seq OWNER TO postgres;

--
-- Name: machine_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.machine_status_id_seq OWNED BY public.machine_status.id;


--
-- Name: operators; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operators (
    operator_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    assigned_shift character varying(20) NOT NULL
);


ALTER TABLE public.operators OWNER TO postgres;

--
-- Name: production_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.production_logs (
    log_id integer NOT NULL,
    machine_id integer NOT NULL,
    shift character varying(50),
    material_type_1 character varying(100),
    material_qty_1 numeric(10,2),
    material_type_2 character varying(100),
    material_qty_2 numeric(10,2),
    material_type_3 character varying(100),
    material_qty_3 numeric(10,2),
    material_type_4 character varying(100),
    material_qty_4 numeric(10,2),
    material_color character varying(100),
    color_qty numeric(10,2),
    mold_type character varying(100),
    cavity integer,
    cycle_timing integer,
    start_time timestamp with time zone,
    stop_time timestamp with time zone,
    runned_time character varying(50),
    total_output integer,
    stop_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    approval_status character varying(50) DEFAULT 'pending'::character varying,
    session_start_time timestamp with time zone,
    product_name character varying(255)
);


ALTER TABLE public.production_logs OWNER TO postgres;

--
-- Name: production_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.production_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.production_logs_log_id_seq OWNER TO postgres;

--
-- Name: production_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.production_logs_log_id_seq OWNED BY public.production_logs.log_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text NOT NULL
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
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: head_attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.head_attendance ALTER COLUMN id SET DEFAULT nextval('public.head_attendance_id_seq'::regclass);


--
-- Name: hourly_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hourly_logs ALTER COLUMN id SET DEFAULT nextval('public.hourly_logs_id_seq'::regclass);


--
-- Name: inventory_colors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_colors ALTER COLUMN id SET DEFAULT nextval('public.inventory_colors_id_seq'::regclass);


--
-- Name: inventory_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_materials ALTER COLUMN id SET DEFAULT nextval('public.inventory_materials_id_seq'::regclass);


--
-- Name: inventory_molds id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_molds ALTER COLUMN id SET DEFAULT nextval('public.inventory_molds_id_seq'::regclass);


--
-- Name: inventory_packing id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_packing ALTER COLUMN id SET DEFAULT nextval('public.inventory_packing_id_seq'::regclass);


--
-- Name: inventory_product id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_product ALTER COLUMN id SET DEFAULT nextval('public.finished_goods_inventory_id_seq'::regclass);


--
-- Name: machine_status id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.machine_status ALTER COLUMN id SET DEFAULT nextval('public.machine_status_id_seq'::regclass);


--
-- Name: production_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_logs ALTER COLUMN log_id SET DEFAULT nextval('public.production_logs_log_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, staff_id, staff_name, attendance_date, shift, status) FROM stdin;
1	OP003	Rohan Varma	2026-01-19	Night	Absent
2	OP004	Vikram Singh	2026-01-19	Night	Present
3	OP006	Kalaiarasan T	2026-01-19	Night	Present
4	OP007	Yuvaraj	2026-01-19	Night	Present
5	OP009	Nethaji	2026-01-19	Night	Present
6	OP010	Diwakar	2026-01-19	Night	Present
7	OP001	Arjun Mehta	2026-01-19	Morning	Absent
8	OP002	Sanjay Dutt	2026-01-19	Morning	Present
9	OP005	Priya Sharma	2026-01-19	Morning	Present
10	OP008	Pandiyarajan	2026-01-19	Morning	Present
11	OP011	Prabhakar	2026-01-19	Morning	Present
12	OP003	Rohan Varma	2026-01-20	Night	Absent
13	OP004	Vikram Singh	2026-01-20	Night	Present
14	OP006	Kalaiarasan T	2026-01-20	Night	Present
15	OP007	Yuvaraj	2026-01-20	Night	Absent
16	OP009	Nethaji	2026-01-20	Night	Present
17	OP010	Diwakar	2026-01-20	Night	Present
18	OP001	Arjun Mehta	2026-01-20	Morning	Absent
19	OP002	Sanjay Dutt	2026-01-20	Morning	Present
20	OP005	Priya Sharma	2026-01-20	Morning	Absent
21	OP008	Pandiyarajan	2026-01-20	Morning	Present
22	OP011	Prabhakar	2026-01-20	Morning	Absent
33	OP001	Arjun Mehta	2026-01-21	Morning	Absent
34	OP002	Sanjay Dutt	2026-01-21	Morning	Present
35	OP005	Priya Sharma	2026-01-21	Morning	Absent
36	OP008	Pandiyarajan	2026-01-21	Morning	Present
37	OP011	Prabhakar	2026-01-21	Morning	Absent
38	Opfgg	Ftff	2026-01-21	Morning	Present
39	OP003	Rohan Varma	2026-01-21	Night	Present
40	OP004	Vikram Singh	2026-01-21	Night	Absent
41	OP006	Kalaiarasan T	2026-01-21	Night	Present
42	OP007	Yuvaraj	2026-01-21	Night	Absent
43	OP009	Nethaji	2026-01-21	Night	Present
44	OP010	Diwakar	2026-01-21	Night	Absent
45	OP001	Arjun Mehta	2026-01-22	Morning	Absent
46	OP002	Sanjay Dutt	2026-01-22	Morning	Present
47	OP005	Priya Sharma	2026-01-22	Morning	Present
48	OP008	Pandiyarajan	2026-01-22	Morning	Absent
49	OP011	Prabhakar	2026-01-22	Morning	Absent
50	Opfgg	Ftff	2026-01-22	Morning	Present
51	OP003	Rohan Varma	2026-01-22	Night	Absent
52	OP004	Vikram Singh	2026-01-22	Night	Present
53	OP006	Kalaiarasan T	2026-01-22	Night	Absent
54	OP007	Yuvaraj	2026-01-22	Night	Present
55	OP009	Nethaji	2026-01-22	Night	Present
56	OP010	Diwakar	2026-01-22	Night	Present
\.


--
-- Data for Name: head_attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.head_attendance (id, email, role, login_time, date_only) FROM stdin;
1	head@factory.com	PRODUCTION HEAD	2026-01-21 13:50:07.756128	2026-01-21
2	qa@factory.com	QUALITY	2026-01-21 13:51:56.866834	2026-01-21
3	pack@factory.com	PACKING	2026-01-21 13:52:51.593201	2026-01-21
4	qa@factory.com	QUALITY	2026-01-22 13:01:29.198953	2026-01-22
5	head@factory.com	PRODUCTION HEAD	2026-01-22 13:11:42.896516	2026-01-22
6	pack@factory.com	PACKING	2026-01-22 18:48:14.780182	2026-01-22
7	head@factory.com	PRODUCTION HEAD	2026-01-23 17:47:14.894881	2026-01-23
8	head@factory.com	PRODUCTION HEAD	2026-01-25 23:15:01.818506	2026-01-25
9	head@factory.com	PRODUCTION HEAD	2026-01-29 15:36:26.219933	2026-01-29
10	head@factory.com	PRODUCTION HEAD	2026-02-09 12:02:37.786281	2026-02-09
11	head@factory.com	PRODUCTION HEAD	2026-02-12 13:55:48.118329	2026-02-12
12	head@factory.com	PRODUCTION HEAD	2026-02-13 14:08:09.690504	2026-02-13
13	head@factory.com	PRODUCTION HEAD	2026-02-16 13:46:04.296343	2026-02-16
14	head@factory.com	PRODUCTION HEAD	2026-02-17 12:33:28.349681	2026-02-17
15	head@factory.com	PRODUCTION HEAD	2026-02-23 16:46:40.252408	2026-02-23
16	head@factory.com	PRODUCTION HEAD	2026-02-25 15:34:18.109587	2026-02-25
17	head@factory.com	PRODUCTION HEAD	2026-02-26 16:17:26.080969	2026-02-26
18	head@factory.com	PRODUCTION HEAD	2026-03-03 14:25:14.84005	2026-03-03
\.


--
-- Data for Name: hourly_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hourly_logs (id, machine_id, machine_name, shift, total_output, hourly_output, chiller_check, compressor_check, mould_check, machine_check, remarks, "timestamp") FROM stdin;
1	1	UNIT 1	\N	120	120	t	t	t	t	No	2026-01-29 15:08:34.035+05:30
2	1	UNIT 1	\N	240	120	t	t	f	f	Repair 	2026-01-29 15:10:04.002+05:30
3	1	UNIT 1	\N	360	120	f	f	f	f	Not ok	2026-01-29 15:12:08.269+05:30
4	2	UNIT 2	\N	72	72	f	f	f	f	Emp	2026-01-29 15:32:13.977+05:30
5	1	UNIT 1	\N	816	360	t	t	t	t	20	2026-01-29 17:32:55.203+05:30
6	1	UNIT 1	\N	1644	720	f	f	f	f		2026-01-29 17:38:03.063+05:30
7	3	UNIT 3	\N	118	48	f	f	f	f		2026-01-29 17:45:05.337+05:30
40	1	UNIT 1	\N	120	120	t	t	t	t	Yhg	2026-01-29 22:22:20.299+05:30
41	1	UNIT 1	\N	450	450	f	f	f	f		2026-01-29 22:28:26.28+05:30
42	1	UNIT 1	\N	570	120	f	f	f	f		2026-01-29 22:30:24.675+05:30
43	1	UNIT 1	\N	0	0	f	f	f	f		2026-01-30 12:37:54.704+05:30
44	2	UNIT 2	\N	258	258	t	t	t	t		2026-01-30 15:29:05.366+05:30
45	2	UNIT 2	\N	586	328	t	f	t	f		2026-01-30 15:32:02.871+05:30
46	1	UNIT 1	\N	144	144	f	f	f	f		2026-02-02 16:33:07.963+05:30
47	1	UNIT 1	\N	204	204	t	t	t	t		2026-02-02 16:44:25.873+05:30
48	1	UNIT 1	\N	130	0	f	f	f	f		2026-02-02 16:46:36.963+05:30
49	1	UNIT 1	\N	170	0	f	f	f	f		2026-02-02 16:49:26.092+05:30
50	1	UNIT 1	\N	4	4	f	f	f	f		2026-02-02 16:52:03.849+05:30
51	1	UNIT 1	\N	4	0	f	f	f	f		2026-02-02 16:54:08.964+05:30
52	1	UNIT 1	\N	4	0	f	f	f	f		2026-02-02 16:56:31.015+05:30
53	1	UNIT 1	\N	58	46	f	f	f	f		2026-02-02 17:25:43.143+05:30
54	1	UNIT 1	\N	8	8	f	f	f	f		2026-02-04 12:01:05.073+05:30
55	1	UNIT 1	\N	123	123	f	f	f	f		2026-02-04 12:52:06.036+05:30
56	1	UNIT 1	\N	50	50	f	f	f	f		2026-02-04 13:35:20.699+05:30
57	1	UNIT 1	\N	49	49	f	f	f	f		2026-02-06 13:25:57.15+05:30
58	1	UNIT 1	\N	367	367	f	f	f	f		2026-02-06 14:01:36.731+05:30
59	1	UNIT 1	\N	73	73	f	f	f	f		2026-02-06 17:04:51.423+05:30
60	1	UNIT 1	\N	149	149	f	f	f	f		2026-02-06 17:12:33.349+05:30
61	3	UNIT 3	\N	954	954	f	f	f	f		2026-02-06 17:19:07.513+05:30
62	1	UNIT 1	\N	165	165	f	f	f	f		2026-02-06 17:31:37.233+05:30
63	2	UNIT 2	\N	26	26	f	f	f	f		2026-02-06 17:43:39.245+05:30
64	1	UNIT 1	\N	40774	40774	f	f	f	f		2026-02-09 14:43:40.414+05:30
65	3	UNIT 3	\N	3546	3546	f	f	f	f		2026-02-09 15:09:45.038+05:30
66	1	UNIT 1	\N	268	268	f	f	f	f		2026-02-09 17:45:46.682+05:30
67	2	UNIT 2	\N	0	0	f	f	f	f		2026-02-12 01:38:36.386+05:30
68	2	UNIT 2	\N	0	0	f	f	f	f		2026-02-12 01:41:12.082+05:30
69	1	UNIT 1	\N	4326	4326	f	f	f	f		2026-02-12 15:01:50.778+05:30
70	1	UNIT 1	\N	5424	5424	f	f	f	f		2026-02-12 17:27:45.109+05:30
71	2	UNIT 2	\N	546	546	f	f	f	f		2026-02-12 18:05:37.338+05:30
72	2	UNIT 2	\N	568	568	t	t	t	t		2026-02-12 18:40:28.58+05:30
\.


--
-- Data for Name: inventory_colors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_colors (id, color_name, stock_qty_kgs) FROM stdin;
8	Alak Blue	100.0
9	Kansbec White	100.0
10	Kansbec Black	100.0
11	Kansbec Red	100.0
12	Natural	\N
\.


--
-- Data for Name: inventory_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_materials (id, material_name, opening_stock, used_stock, minimum_stock_level, unit, closing_stock) FROM stdin;
1	Reliance AM650	100.00	0.00	20.00	KG	100.00
2	Reliance SRM100	100.00	0.00	20.00	KG	100.00
3	Reliance B650N	100.00	0.00	20.00	KG	100.00
4	MRPL	100.00	0.00	20.00	KG	100.00
\.


--
-- Data for Name: inventory_molds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_molds (id, mold_name, cavity_options) FROM stdin;
1	50ml Cup	6
2	100ml Cont	8
3	100ml Lid	8
4	250ml Cont	4
5	250 Tumbler	4
6	500ml Cont(Old)	2
7	500ml Cont(New)	2
8	500ml Lid	6
9	750ml Cont(Old)	2
10	750ml Cont(New)	2
11	750ml Lid(Old)	2
12	750ml Lid(New)	4
13	750ml Round Cont	2
14	1000ml Round Cont	2
15	750ml/1000ml Round lid	2
\.


--
-- Data for Name: inventory_packing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_packing (id, item_name, stock_qty_pcs) FROM stdin;
\.


--
-- Data for Name: inventory_product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_product (id, product_name, opening_stock, used_stock, closing_stock, minimum_stock_level, unit_weight_gm, last_update) FROM stdin;
2	100ML Round NaT	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
3	100ML Round BK	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
4	100ML Round WT COUNT	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
5	100ML Round WT LID	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
6	250ML Round BLUE	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
7	250ML Round NAT	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
8	250ML Round WT	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
9	250ML Round RED	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
10	250ML Round BK	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
11	500ML Round BLUE	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
12	500ML Round NAT	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
13	500ML Round WT	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
14	500ML Round RED	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
15	500ML Round BK	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
16	750ML Reat NAT	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
17	750ML Reat WT	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
18	750ML Reat BK	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
19	750ML Round NAT	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
20	750ML Round WT	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
21	750ML Round RED	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
22	750ML Round BK	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
23	1000ML Round NAT	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
24	1000ML Round WT	1000	0	1000	200	0.500	2026-02-12 16:12:09.487993
25	1000ML Round RED	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
26	1000ML Round BK	5000	0	5000	1000	0.500	2026-02-12 16:12:09.487993
1	50ML Cup NAT	1000	0	50	200	0.500	2026-02-12 16:12:09.487993
\.


--
-- Data for Name: machine_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.machine_status (id, machine_name, status, total_output, start_time, material_qty_1, shift, material_type_1, mold_type, cavity, material_type_2, material_qty_2, material_type_3, material_qty_3, material_type_4, material_qty_4, material_color, color_qty, cycle_timing, stop_reason, accumulated_output, stop_time, hourly_units, last_report_at, resume_time, session_start_time, product_name) FROM stdin;
8	Shibavra 250T	idle	0	\N	0	Night Shift	None	1000ml Round Cont	1	None	0	None	0	None	0	Natural	0	2		0	\N	0	2026-01-30 12:28:24.513539	\N	2026-02-12 13:21:08.964+05:30	\N
5	Shibavra 180T	idle	0	\N	3	Day Shift	Reliance AM650	500ml Lid	6	MRPL	4	Reliance B650N	2	None	0	Kansbec Red	2	2		0	\N	0	2026-01-30 12:28:24.513539	2026-02-12 15:02:16.027+05:30	2026-02-12 14:32:18.796+05:30	\N
6	Shibavra 180T	idle	0	\N	2	Day Shift	Reliance AM650		1	MRPL	3	None	0	None	0	Natural	0	5		0	\N	0	2026-01-30 12:28:24.513539	2026-02-12 15:02:16.027+05:30	2026-02-12 14:33:12.39+05:30	\N
2	Shibavra 250T	idle	0	\N	0	Day Shift	None	250 Tumbler	4	None	0	None	0	Reliance B650N	1	Natural	0	2		0	\N	0	2026-01-30 12:28:24.513539	\N	2026-03-03 19:01:41.202+05:30	250ML Round NAT
3	Shibavra 250T	idle	0	\N	20	Day Shift	Reliance AM650	100ml Lid	8	Reliance B650N	20	None	0	None	0	Natural	0	1		0	\N	0	2026-01-30 12:28:24.513539	\N	2026-03-03 14:37:42.537+05:30	100ML Round NaT
7	Shibavra 250T	idle	0	\N	2	Day Shift	Reliance SRM100	250ml Cont	4	None	0	None	0	None	0	Natural	0	5		0	\N	0	2026-01-30 12:28:24.513539	\N	2026-02-12 14:34:18.256+05:30	\N
4	Shibavra 180T	idle	0	\N	5	Day Shift	Reliance B650N	500ml Cont(New)	2	Reliance AM650	5	Reliance SRM100	5	None	0	Natural	0	5		0	\N	0	2026-01-30 12:28:24.513539	\N	2026-03-03 14:38:18.961+05:30	500ML Round WT
1	Shibavra 250T	idle	0	\N	2	Day Shift	Reliance AM650	100ml Cont	8	Reliance AM650	2	None	0	None	0	Natural	0	2		0	\N	0	2026-01-30 12:28:24.513539	\N	2026-03-03 20:05:40.366+05:30	100ML Round WT COUNT
\.


--
-- Data for Name: operators; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operators (operator_id, name, assigned_shift) FROM stdin;
OP001	Arjun Mehta	Morning
OP002	Sanjay Dutt	Morning
OP003	Rohan Varma	Night
OP004	Vikram Singh	Night
OP005	Priya Sharma	Morning
OP006	Kalaiarasan T	Night
OP007	Yuvaraj	Night
OP008	Pandiyarajan	Morning
OP009	Nethaji	Night
OP010	Diwakar	Night
OP011	Prabhakar	Morning
Opfgg	Ftff	Morning
\.


--
-- Data for Name: production_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.production_logs (log_id, machine_id, shift, material_type_1, material_qty_1, material_type_2, material_qty_2, material_type_3, material_qty_3, material_type_4, material_qty_4, material_color, color_qty, mold_type, cavity, cycle_timing, start_time, stop_time, runned_time, total_output, stop_reason, created_at, approval_status, session_start_time, product_name) FROM stdin;
1	1	Day Shift	Reliance AM650	20.00	Reliance AM650	20.00	Reliance B650N	20.00	Reliance SRM100	20.00	Kansbec Red	20.00	1000ml Round Cont	2	7	2026-01-23 14:51:58.727+05:30	2026-01-23 14:52:24.617+05:30	0 Minutes	6	Reason	2026-01-23 14:53:50.095007+05:30	pending	\N	\N
2	1	Day Shift	MRPL	10.00	None	0.00	Reliance B650N	10.00	Reliance SRM100	5.00	Kansbec White	2.00	1000ml Round Cont	2	5	2026-01-23 14:55:18.768+05:30	2026-01-23 14:58:27.68+05:30	3 Minutes	74	Tharila	2026-01-23 14:58:32.456158+05:30	pending	\N	\N
3	1	Night Shift	None	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	5	2026-01-23 15:02:04.04+05:30	2026-01-23 15:02:11.397+05:30	0 Minutes	2	Why 	2026-01-23 15:02:14.344399+05:30	pending	\N	\N
4	1	Day Shift	Reliance AM650	20.00	Reliance B650N	20.00	None	0.00	Reliance B650N	20.00	Alak Blue	5.00	1000ml Round Cont	2	1	2026-01-23 15:08:41.589+05:30	2026-01-23 15:09:12.255+05:30	0 Minutes	60	Test	2026-01-23 15:09:27.61418+05:30	pending	\N	\N
5	1	Day Shift	MRPL	30.00	Reliance B650N	30.00	Reliance AM650	30.00	Reliance SRM100	30.00	Kansbec Red	5.00	1000ml Round Cont	2	1	2026-01-23 15:13:07.522+05:30	2026-01-23 15:13:16.362+05:30	0 Minutes	16	Test	2026-01-23 15:13:35.830108+05:30	pending	\N	\N
6	1	Day Shift	Reliance AM650	0.00	Reliance B650N	0.00	Reliance B650N	0.00	Reliance B650N	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-01-23 15:49:08.918+05:30	2026-01-23 15:49:25.785+05:30	0 Minutes	32	Ghhh	2026-01-23 15:49:29.079726+05:30	pending	\N	\N
7	1	Day Shift	Reliance AM650	0.00	Reliance SRM100	0.00	Reliance SRM100	0.00	Reliance SRM100	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-01-23 15:49:44.185+05:30	2026-01-23 15:49:48.075+05:30	0 Minutes	6	Ghh	2026-01-23 15:49:50.878107+05:30	pending	\N	\N
8	1	Day Shift	Reliance AM650	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-01-23 15:50:43.059+05:30	2026-01-23 15:51:21.642+05:30	0 Minutes	76	Kalai	2026-01-23 15:51:27.581929+05:30	pending	\N	\N
9	1	Day Shift	Reliance B650N	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-01-23 15:51:31.462+05:30	2026-01-23 15:51:42.96+05:30	0 Minutes	22	Igjvvv	2026-01-23 15:51:45.850444+05:30	pending	\N	\N
10	1	Day Shift	Reliance AM650	20.00	Reliance B650N	20.00	Reliance AM650	50.00	None	0.00	Kansbec Red	0.50	1000ml Round Cont	2	1	2026-01-23 17:48:19.516+05:30	2026-01-23 17:49:47.26+05:30	1 Minutes	174	Wrong	2026-01-23 17:50:01.53688+05:30	pending	\N	\N
11	1	Day Shift	Reliance AM650	20.00	Reliance AM650	20.00	Reliance B650N	20.00	Reliance AM650	20.00	Natural	0.00	1000ml Round Cont	2	2	2026-01-23 21:38:07.365+05:30	2026-01-23 21:39:48.195+05:30	1 Minutes	100	Power 	2026-01-23 21:40:25.844969+05:30	pending	\N	\N
12	1	Night Shift	Reliance B650N	10.00	Reliance B650N	10.00	Reliance AM650	10.00	None	0.00	Kansbec Black	0.50	1000ml Round Cont	2	2	2026-01-23 21:41:28.9+05:30	2026-01-23 21:42:03.422+05:30	0 Minutes	34	Ginvg	2026-01-23 21:42:15.382328+05:30	pending	\N	\N
13	1	Day Shift	Reliance AM650	20.00	Reliance B650N	20.00	Reliance B650N	50.00	None	0.00	Kansbec Red	0.25	500ml Cont(Old)	2	2	2026-01-24 12:40:42.727+05:30	2026-01-24 12:42:09.595+05:30	1 Minutes	86	Why is stopping 	2026-01-24 12:42:25.397197+05:30	pending	\N	\N
14	1	Day Shift	Reliance AM650	10.00	Reliance AM650	5.00	Reliance B650N	5.00	None	0.00	Kansbec Black	0.50	500ml Lid	6	2	2026-01-24 12:47:59.842+05:30	2026-01-24 12:49:08.59+05:30	1 Minutes	198	Periodic Update	2026-01-24 12:49:11.215056+05:30	pending	\N	\N
15	1	Day Shift	Reliance AM650	10.00	Reliance AM650	5.00	Reliance B650N	5.00	None	0.00	Kansbec Black	0.50	500ml Lid	6	2	2026-01-24 12:47:59.842+05:30	2026-01-24 12:49:46.454+05:30	1 Minutes	318	Periodic Update	2026-01-24 12:49:49.079739+05:30	pending	\N	\N
16	1	Day Shift	Reliance AM650	10.00	Reliance AM650	5.00	Reliance B650N	5.00	None	0.00	Kansbec Black	0.50	500ml Lid	6	2	2026-01-24 12:47:59.842+05:30	2026-01-24 12:49:51.837+05:30	1 Minutes	330	Hellow	2026-01-24 12:49:55.503223+05:30	pending	\N	\N
17	1	Day Shift	MRPL	5.00	Reliance B650N	5.00	Reliance SRM100	5.00	None	0.00	Alak Blue	0.50	250ml Cont	4	1	2026-01-24 12:58:30.527+05:30	2026-01-24 13:00:09.357+05:30	1 Minutes	392	Periodic Update	2026-01-24 13:00:11.974182+05:30	pending	\N	\N
18	1	Day Shift	MRPL	5.00	Reliance B650N	5.00	Reliance SRM100	5.00	None	0.00	Alak Blue	0.50	250ml Cont	4	1	2026-01-24 12:58:30.527+05:30	2026-01-24 13:00:21.842+05:30	1 Minutes	444	Hello	2026-01-24 13:00:32.675003+05:30	pending	\N	\N
19	1	Day Shift	Reliance AM650	50.00	Reliance B650N	50.00	Reliance AM650	50.00	None	0.00	Kansbec Black	0.20	250ml Cont	4	1	2026-01-24 13:30:52.344+05:30	2026-01-24 13:33:32.319+05:30	2 Minutes	636	Periodic Update	2026-01-24 13:33:34.919494+05:30	pending	\N	\N
20	1	Day Shift	Reliance AM650	50.00	Reliance B650N	50.00	Reliance AM650	50.00	None	0.00	Kansbec Black	0.20	250ml Cont	4	1	2026-01-24 13:30:52.344+05:30	2026-01-24 13:33:39.907+05:30	2 Minutes	668	Why	2026-01-24 13:33:45.06594+05:30	pending	\N	\N
21	1	Day Shift	Reliance AM650	20.00	Reliance SRM100	20.00	Reliance B650N	20.00	None	0.00	Natural	0.00	750ml Cont(New)	2	2	2026-01-24 13:37:47.474+05:30	2026-01-24 13:39:14.205+05:30	1 Minutes	86	Periodic Update	2026-01-24 13:39:16.945347+05:30	pending	\N	\N
22	2	Day Shift	None	0.00	Reliance B650N	50.00	Reliance AM650	50.00	Reliance SRM100	30.00	Kansbec Red	0.60	500ml Lid	6	5	2026-01-24 13:38:13.265+05:30	2026-01-24 13:39:19.477+05:30	1 Minutes	78	Periodic Update	2026-01-24 13:39:22.071173+05:30	pending	\N	\N
23	2	Day Shift	None	0.00	Reliance B650N	50.00	Reliance AM650	50.00	Reliance SRM100	30.00	Kansbec Red	0.60	500ml Lid	6	5	2026-01-24 13:38:13.265+05:30	2026-01-24 13:39:37.79+05:30	1 Minutes	96	Periodic Update	2026-01-24 13:39:40.382344+05:30	pending	\N	\N
24	1	Day Shift	Reliance AM650	20.00	Reliance SRM100	20.00	Reliance B650N	20.00	None	0.00	Natural	0.00	750ml Cont(New)	2	2	2026-01-24 13:37:47.474+05:30	2026-01-24 13:39:43.464+05:30	1 Minutes	114	Periodic Update	2026-01-24 13:39:46.066751+05:30	pending	\N	\N
25	3	Day Shift	MRPL	90.00	Reliance SRM100	20.00	Reliance AM650	30.00	None	0.00	Kansbec Black	0.60	100ml Lid	8	5	2026-01-24 13:38:39.809+05:30	2026-01-24 13:39:48.944+05:30	1 Minutes	104	Periodic Update	2026-01-24 13:39:51.541892+05:30	pending	\N	\N
26	1	Day Shift	Reliance AM650	20.00	Reliance SRM100	20.00	Reliance B650N	20.00	None	0.00	Natural	0.00	750ml Cont(New)	2	2	2026-01-24 13:37:47.474+05:30	2026-01-24 15:03:03.408+05:30	85 Minutes	5114	Periodic Update	2026-01-24 15:03:06.02668+05:30	pending	\N	\N
27	1	Day Shift	Reliance AM650	20.00	Reliance SRM100	20.00	Reliance B650N	20.00	None	0.00	Natural	0.00	750ml Cont(New)	2	2	2026-01-24 15:17:22.08648+05:30	2026-01-24 15:23:32.805+05:30	6 Minutes	370	Periodic Update	2026-01-24 15:23:35.359888+05:30	pending	\N	\N
28	1	Day Shift	Reliance AM650	20.00	Reliance SRM100	20.00	Reliance B650N	20.00	None	0.00	Natural	0.00	750ml Cont(New)	2	2	2026-01-24 15:25:05.812432+05:30	2026-01-24 15:25:39.888+05:30	0 Minutes	452	Reason	2026-01-24 15:25:55.427101+05:30	pending	\N	\N
29	2	Day Shift	None	0.00	Reliance B650N	50.00	Reliance AM650	50.00	Reliance SRM100	30.00	Kansbec Red	0.60	500ml Lid	6	5	2026-01-24 15:25:05.812432+05:30	2026-01-24 15:26:15.379+05:30	1 Minutes	31398	Periodic Update	2026-01-24 15:26:17.943253+05:30	pending	\N	\N
30	2	Day Shift	None	0.00	Reliance B650N	50.00	Reliance AM650	50.00	Reliance SRM100	30.00	Kansbec Red	0.60	500ml Lid	6	5	2026-01-24 15:25:05.812432+05:30	2026-01-24 15:26:19.592+05:30	1 Minutes	31482	Op	2026-01-24 15:26:23.042501+05:30	pending	\N	\N
31	3	Day Shift	MRPL	90.00	Reliance SRM100	20.00	Reliance AM650	30.00	None	0.00	Kansbec Black	0.60	100ml Lid	8	5	2026-01-24 15:25:05.812432+05:30	2026-01-24 15:26:26.947+05:30	1 Minutes	41848	Periodic Update	2026-01-24 15:26:29.49326+05:30	pending	\N	\N
32	3	Day Shift	MRPL	90.00	Reliance SRM100	20.00	Reliance AM650	30.00	None	0.00	Kansbec Black	0.60	100ml Lid	8	5	2026-01-24 15:25:05.812432+05:30	2026-01-24 15:26:25.887+05:30	1 Minutes	41848	Op	2026-01-24 15:26:31.236518+05:30	pending	\N	\N
33	1	Day Shift	Reliance B650N	5.00	Reliance SRM100	6.00	Reliance AM650	7.00	None	0.00	Kansbec Black	0.60	1000ml Round Cont	2	2	2026-01-24 15:38:30.924+05:30	2026-01-24 15:39:57.082+05:30	1 Minutes	84	Periodic Update	2026-01-24 15:39:59.743063+05:30	pending	\N	\N
34	1	Day Shift	Reliance B650N	5.00	Reliance SRM100	6.00	Reliance AM650	7.00	None	0.00	Kansbec Black	0.60	1000ml Round Cont	2	2	2026-01-24 15:47:13.489192+05:30	2026-01-24 15:47:21.053+05:30	0 Minutes	70	Hello	2026-01-24 15:47:27.002222+05:30	pending	\N	\N
35	1	Day Shift	Reliance AM650	20.00	Reliance B650N	20.00	MRPL	50.00	None	0.00	Kansbec Black	0.50	1000ml Round Cont	2	2	2026-01-24 15:52:19.55625+05:30	2026-01-24 15:55:19.958+05:30	3 Minutes	20004	Periodic Update	2026-01-24 15:55:22.578068+05:30	pending	\N	\N
36	1	Day Shift	Reliance AM650	20.00	Reliance B650N	20.00	MRPL	50.00	None	0.00	Kansbec Black	0.50	1000ml Round Cont	2	2	2026-01-24 15:56:49.588218+05:30	2026-01-24 15:57:52.852+05:30	1 Minutes	270	Periodic Update	2026-01-24 15:57:55.39509+05:30	pending	\N	\N
37	1	Day Shift	Reliance AM650	20.00	Reliance B650N	20.00	MRPL	50.00	None	0.00	Kansbec Black	0.50	1000ml Round Cont	2	2	2026-01-24 15:56:49.588218+05:30	2026-01-24 15:58:54.104+05:30	2 Minutes	392	Periodic Update	2026-01-24 15:58:56.655261+05:30	pending	\N	\N
38	1	Day Shift	Reliance AM650	20.00	Reliance B650N	20.00	MRPL	50.00	None	0.00	Kansbec Black	0.50	1000ml Round Cont	2	2	2026-01-24 15:56:49.588218+05:30	2026-01-24 15:59:53.647+05:30	3 Minutes	574	Periodic Update	2026-01-24 15:59:56.179754+05:30	pending	\N	\N
39	1	Day Shift	Reliance AM650	20.00	Reliance B650N	20.00	MRPL	50.00	None	0.00	Kansbec Black	0.50	1000ml Round Cont	2	2	2026-01-24 15:56:49.588218+05:30	2026-01-24 16:14:08.233+05:30	17 Minutes	1038	Periodic Update	2026-01-24 16:14:10.78029+05:30	pending	\N	\N
40	1	Day Shift	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1000ml Round Cont	2	2	\N	2026-01-24 16:37:43.685+05:30	\N	6	Hhna	2026-01-24 16:37:47.455708+05:30	pending	\N	\N
41	1	Day Shift	None	0.00	Reliance AM650	30.00	Reliance B650N	30.00	Reliance SRM100	30.00	Natural	0.00	1000ml Round Cont	2	2	2026-01-24 17:00:32.303+05:30	2026-01-24 17:00:52.903+05:30	0 Minutes	20	Qba	2026-01-24 17:00:56.417333+05:30	pending	\N	\N
42	1	Day Shift	Reliance AM650	50.00	Reliance B650N	60.00	Reliance AM650	70.00	None	0.00	Natural	0.00	500ml Cont(Old)	2	2	2026-01-24 17:30:31.839+05:30	2026-01-24 17:34:33.344+05:30	4 Minutes	240	Periodic Update	2026-01-24 17:34:35.843213+05:30	pending	\N	\N
43	1	Day Shift	Reliance AM650	50.00	Reliance B650N	60.00	Reliance AM650	70.00	None	0.00	Natural	0.00	500ml Cont(Old)	2	2	2026-01-24 17:30:31.839+05:30	2026-01-24 17:35:37.079+05:30	5 Minutes	544	Periodic Update	2026-01-24 17:35:39.584414+05:30	pending	\N	\N
44	1	Day Shift	Reliance AM650	50.00	Reliance B650N	60.00	Reliance AM650	70.00	None	0.00	Natural	0.00	500ml Cont(Old)	2	2	2026-01-24 17:30:31.839+05:30	2026-01-24 17:35:43.308+05:30	5 Minutes	854	Usjnw	2026-01-24 17:35:46.842819+05:30	pending	\N	\N
45	1	Day Shift	Reliance B650N	10.00	Reliance AM650	10.00	MRPL	10.00	Reliance B650N	20.00	Kansbec Black	0.50	50ml Cup	6	2	2026-01-24 17:38:24.273+05:30	2026-01-24 17:39:28.925+05:30	1 Minutes	186	Periodic Update	2026-01-24 17:39:31.436838+05:30	pending	\N	\N
46	1	Day Shift	Reliance B650N	10.00	Reliance AM650	10.00	MRPL	10.00	Reliance B650N	20.00	Kansbec Black	0.50	50ml Cup	6	2	2026-01-24 17:38:24.273+05:30	2026-01-24 17:40:18.496+05:30	1 Minutes	336	Periodic Update	2026-01-24 17:40:21.000743+05:30	pending	\N	\N
47	1	Day Shift	Reliance B650N	10.00	Reliance AM650	10.00	MRPL	10.00	Reliance B650N	20.00	Kansbec Black	0.50	50ml Cup	6	2	2026-01-24 17:38:24.273+05:30	2026-01-24 17:40:23.39+05:30	1 Minutes	690	Opwer	2026-01-24 17:40:27.601499+05:30	pending	\N	\N
48	1	Night Shift	MRPL	50.00	Reliance B650N	20.00	Reliance AM650	28.00	None	0.00	Kansbec White	0.50	750ml Cont(New)	2	2	2026-01-24 17:52:39.28+05:30	2026-01-24 17:54:11.589+05:30	1 Minutes	92	What 	2026-01-24 17:54:21.204238+05:30	pending	\N	\N
49	1	Day Shift	Reliance AM650	20.00	Reliance B650N	20.00	Reliance AM650	20.00	Reliance B650N	50.00	Kansbec Black	0.50	750ml Cont(New)	2	2	2026-01-25 23:14:35.383+05:30	2026-01-25 23:16:06.729+05:30	1 Minutes	90	Hello	2026-01-25 23:16:12.336001+05:30	pending	\N	\N
50	1	Day Shift	Reliance AM650	10.00	Reliance B650N	10.00	Reliance SRM100	10.00	Reliance AM650	1.00	Natural	0.00	750ml Cont(New)	2	2	2026-01-26 00:33:14.984+05:30	2026-01-26 00:33:22.525+05:30	0 Minutes	2960	Reason	2026-01-26 00:33:42.705376+05:30	pending	\N	\N
51	2	Day Shift	Reliance AM650	20.00	Reliance AM650	20.00	None	0.00	None	0.00	Kansbec Black	0.50	500ml Lid	6	5	2026-01-26 00:33:14.984+05:30	2026-01-26 00:33:48.643+05:30	0 Minutes	3546	Fggv	2026-01-26 00:33:51.120165+05:30	pending	\N	\N
52	1	Day Shift	Reliance AM650	60.00	Reliance B650N	90.00	Reliance SRM100	30.00	None	0.00	Natural	0.00	750ml Cont(New)	2	2	2026-01-26 00:55:09.689+05:30	2026-01-26 00:55:18.945+05:30	0 Minutes	160	Tharila	2026-01-26 00:55:37.288739+05:30	pending	\N	\N
53	2	Day Shift	Reliance AM650	10.00	Reliance AM650	5.00	Reliance AM650	6.00	None	0.00	Kansbec White	10.00	250ml Cont	4	10	2026-01-26 00:55:09.689+05:30	2026-01-26 00:55:44.321+05:30	0 Minutes	32	Fgg	2026-01-26 00:55:46.002215+05:30	pending	\N	\N
54	1	Day Shift	Reliance AM650	50.00	Reliance B650N	50.00	Reliance AM650	50.00	None	0.00	Kansbec Black	0.90	50ml Cup	6	2	2026-01-26 01:05:54.925+05:30	2026-01-26 01:06:01.344+05:30	0 Minutes	108	Hello	2026-01-26 01:06:17.898702+05:30	pending	\N	\N
55	1	Day Shift	Reliance AM650	20.00	Reliance B650N	20.00	MRPL	20.00	None	0.00	Natural	0.00	50ml Cup	6	2	2026-01-26 15:52:28.256+05:30	2026-01-26 15:53:20.834+05:30	0 Minutes	270	Machine apss	2026-01-26 15:53:34.318396+05:30	pending	\N	\N
56	1	Day Shift	Reliance AM650	5.00	Reliance B650N	5.00	Reliance SRM100	5.00	None	0.00	Natural	0.00	50ml Cup	6	2	2026-01-26 16:21:39.792+05:30	2026-01-26 16:22:39.999+05:30	1 Minutes	180	Stop	2026-01-26 16:22:49.454795+05:30	pending	\N	\N
57	1	Day Shift	Reliance AM650	5.00	Reliance B650N	2.00	Reliance SRM100	2.00	None	0.00	Natural	0.00	50ml Cup	6	2	2026-01-26 16:23:25.455+05:30	2026-01-26 16:23:30.125+05:30	0 Minutes	54	Check	2026-01-26 16:23:33.90111+05:30	pending	\N	\N
58	1	Day Shift	Reliance B650N	5.00	Reliance B650N	5.00	None	0.00	None	0.00	Natural	0.00	50ml Cup	6	2	2026-01-26 16:24:26.989+05:30	2026-01-26 16:33:06.175+05:30	8 Minutes	1554	Stop	2026-01-26 16:33:10.615953+05:30	pending	\N	\N
59	1	Day Shift	Reliance B650N	5.00	Reliance B650N	6.00	MRPL	7.00	None	0.00	Natural	0.00	750ml Lid(New)	4	2	2026-01-26 16:45:50.559+05:30	2026-01-26 16:46:33.008+05:30	0 Minutes	3168	Hello	2026-01-26 16:46:49.757132+05:30	pending	\N	\N
60	1	Day Shift	Reliance AM650	2.00	Reliance B650N	2.00	Reliance SRM100	2.00	None	0.00	Natural	0.00	750ml Lid(New)	4	2	2026-01-26 17:06:46.55+05:30	2026-01-26 17:06:51.725+05:30	0 Minutes	8	Fff	2026-01-26 17:06:53.584334+05:30	pending	\N	\N
61	1	Day Shift	Reliance AM650	50.00	Reliance B650N	58.00	Reliance AM650	50.00	None	0.00	Natural	0.00	750ml Lid(New)	4	2	2026-01-26 17:32:17.352+05:30	2026-01-26 17:32:20.317+05:30	\N	4	Hnn	2026-01-26 17:32:22.550688+05:30	pending	\N	\N
62	1	Day Shift	Reliance B650N	50.00	Reliance SRM100	50.00	None	0.00	None	0.00	Natural	0.00	750ml Lid(New)	4	2	2026-01-26 17:35:44.582+05:30	2026-01-26 17:35:48.538+05:30	\N	4	Ghbv	2026-01-26 17:35:50.633391+05:30	pending	\N	\N
63	2	Day Shift	Reliance AM650	20.00	MRPL	20.00	None	0.00	None	0.00	Natural	0.00	500ml Lid	6	10	2026-01-26 17:37:33.229+05:30	2026-01-26 17:38:12.565+05:30	\N	18	This is test	2026-01-26 17:38:21.617296+05:30	pending	\N	\N
64	1	Day Shift	Reliance AM650	20.00	Reliance B650N	50.00	None	0.00	None	0.00	Natural	0.00	750ml Lid(New)	4	2	2026-01-26 17:38:40.623+05:30	2026-01-26 17:43:18.95+05:30	\N	768	Test 1	2026-01-26 17:43:28.680433+05:30	pending	\N	\N
65	1	Day Shift	MRPL	20.00	Reliance B650N	20.00	Reliance AM650	20.00	None	0.00	Natural	0.00	750ml Lid(New)	4	2	\N	\N	\N	299832	\N	2026-01-28 12:37:17.830681+05:30	pending	\N	\N
66	1	Day Shift	MRPL	20.00	Reliance B650N	20.00	Reliance AM650	20.00	None	0.00	Natural	0.00	750ml Lid(New)	4	2	2026-01-28 13:17:22.526+05:30	2026-01-28 13:17:58.83+05:30	\N	68	Ghvv	2026-01-28 13:18:01.735421+05:30	pending	\N	\N
67	1	Day Shift	MRPL	20.00	Reliance B650N	20.00	Reliance AM650	20.00	Reliance AM650	5.00	Natural	8.00	750ml Lid(New)	4	2	2026-01-28 13:55:50.866+05:30	2026-01-28 13:56:04.04+05:30	\N	24	Hjj	2026-01-28 13:56:05.901347+05:30	pending	\N	\N
68	1	Day Shift	MRPL	20.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Lid(New)	4	2	2026-01-28 14:01:52.042+05:30	2026-01-28 14:18:22.828+05:30	\N	1976	Ijhv	2026-01-28 14:18:24.31269+05:30	pending	\N	\N
69	1	Day Shift	MRPL	20.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Lid(New)	4	2	\N	\N	\N	12076	\N	2026-01-28 19:00:26.822386+05:30	pending	\N	\N
70	1	Day Shift	MRPL	20.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Lid(New)	4	2	\N	\N	\N	8	\N	2026-01-29 11:17:17.528823+05:30	pending	\N	\N
71	1	Day Shift	MRPL	20.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Lid(New)	4	2	\N	\N	\N	16	\N	2026-01-29 11:27:40.363056+05:30	pending	\N	\N
72	1	Day Shift	Reliance B650N	0.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Lid(New)	4	2	\N	\N	\N	5164	\N	2026-01-29 12:15:21.215918+05:30	pending	\N	\N
73	1	Day Shift	Reliance B650N	50.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Lid(New)	4	2	\N	\N	\N	1796	\N	2026-01-29 12:30:37.609508+05:30	pending	\N	\N
74	1	Day Shift	Reliance B650N	50.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Lid(New)	4	2	\N	\N	\N	2124	\N	2026-01-29 12:49:15.784616+05:30	pending	\N	\N
75	1	Day Shift	Reliance AM650	5.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Cont(New)	2	2	\N	\N	\N	3218	\N	2026-01-29 13:43:16.671347+05:30	pending	\N	\N
76	1	Day Shift	MRPL	50.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Cont(New)	2	2	\N	\N	\N	896	\N	2026-01-29 14:13:45.367158+05:30	pending	\N	\N
77	2	Day Shift	Reliance AM650	50.00	\N	\N	\N	\N	\N	\N	Natural	0.00	500ml Lid	6	10	\N	\N	\N	0	\N	2026-01-29 14:15:00.490027+05:30	pending	\N	\N
78	1	Day Shift	Reliance AM650	5.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Cont(New)	2	2	\N	\N	\N	462	\N	2026-01-29 14:24:31.146504+05:30	pending	\N	\N
79	1	Day Shift	Reliance AM650	5.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Cont(New)	2	2	\N	\N	\N	1984	\N	2026-01-29 14:58:02.258654+05:30	pending	\N	\N
80	1	Day Shift	MRPL	5.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Cont(New)	2	2	\N	\N	\N	376	\N	2026-01-29 15:05:40.537194+05:30	pending	\N	\N
81	1	Day Shift	Reliance B650N	5.00	\N	\N	\N	\N	\N	\N	Natural	8.00	750ml Cont(New)	2	2	\N	\N	\N	532	\N	2026-01-29 15:15:26.420039+05:30	pending	\N	\N
82	1	Day Shift	Reliance AM650	0.00	None	0.00	None	0.00	None	0.00	Natural	8.00	750ml Cont(New)	2	2	\N	\N	\N	10	\N	2026-01-29 15:18:34.431136+05:30	pending	\N	\N
83	8	Night Shift	Reliance SRM100	5.00	Reliance AM650	5.00	Reliance B650N	5.00	None	0.00	Natural	0.00		1	2	\N	\N	\N	4	\N	2026-01-29 15:29:08.651525+05:30	pending	\N	\N
84	2	Day Shift	Reliance AM650	5.00	None	0.00	None	0.00	Reliance B650N	5.00	Natural	0.00	500ml Lid	6	10	\N	\N	\N	186	\N	2026-01-29 15:35:49.697504+05:30	pending	\N	\N
85	1	Day Shift	Reliance AM650	50.00	Reliance B650N	50.00	None	0.00	None	0.00	Natural	0.00	50ml Cup	6	2	\N	\N	\N	1776	\N	2026-01-29 17:38:26.212127+05:30	pending	\N	\N
86	3	Day Shift	MRPL	20.00	Reliance B650N	50.00	None	0.00	None	0.00	Natural	0.00	750ml Round Cont	2	5	\N	\N	\N	144	\N	2026-01-29 17:45:55.403245+05:30	pending	\N	\N
119	1	Day Shift	Reliance AM650	5.00	Reliance B650N	5.00	None	0.00	None	0.00	Natural	0.00	50ml Cup	6	2	\N	\N	\N	42	\N	2026-01-29 21:38:39.76507+05:30	pending	\N	\N
120	1	Day Shift	Reliance B650N	5.00	Reliance B650N	5.00	None	0.00	None	0.00	Natural	0.00	750ml Cont(New)	2	2	\N	\N	\N	580	\N	2026-01-29 22:30:30.178419+05:30	pending	\N	\N
121	1	Day Shift	Reliance AM650	50.00	Reliance AM650	50.00	MRPL	50.00	None	0.00	Natural	0.00	750ml Cont(New)	2	2	\N	\N	\N	7068	\N	2026-01-30 15:25:43.633708+05:30	pending	\N	\N
122	2	Day Shift	Reliance AM650	20.00	Reliance SRM100	20.00	MRPL	20.00	None	0.00	Natural	0.00	750ml Cont(New)	2	1	\N	\N	\N	622	\N	2026-01-30 15:32:21.51602+05:30	pending	\N	\N
123	1	Night Shift	Reliance AM650	5.00	Reliance SRM100	5.00	Reliance SRM100	5.00	None	0.00	Natural	0.00	750ml Cont(New)	2	2	\N	\N	\N	510	\N	2026-02-02 16:49:37.326983+05:30	pending	\N	\N
124	1	Night Shift	Reliance B650N	6.00	Reliance SRM100	6.00	None	0.00	None	0.00	Natural	0.00	750ml Cont(New)	2	60	\N	\N	\N	70	\N	2026-02-02 17:25:48.501933+05:30	pending	\N	\N
125	1	Night Shift	Reliance AM650	30.00	Reliance B650N	30.00	MRPL	10.00	None	0.00	Kansbec White	5.00	750ml Cont(New)	2	60	\N	\N	\N	8	\N	2026-02-04 12:01:50.970245+05:30	pending	\N	\N
126	1	Night Shift	Reliance AM650	5.00	\N	\N	\N	\N	\N	\N	Kansbec White	5.00	750ml Cont(New)	2	2	\N	\N	\N	1820	\N	2026-02-04 12:45:13.035151+05:30	pending	\N	\N
127	1	Day Shift	Reliance AM650	5.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	5	2026-02-04 13:28:29.547+05:30	2026-02-04 13:28:48.899+05:30	\N	18	\N	2026-02-04 13:29:03.016977+05:30	pending	\N	\N
128	1	Day Shift	Reliance AM650	5.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	5	2026-02-04 13:32:17.868+05:30	2026-02-04 13:32:27.26+05:30	\N	2	\N	2026-02-04 13:32:34.815266+05:30	pending	\N	\N
129	1	Day Shift	Reliance AM650	5.00	Reliance B650N	5.00	Reliance SRM100	5.00	None	0.00	Kansbec Red	0.50	1000ml Round Cont	2	5	2026-02-04 13:38:04.932+05:30	2026-02-04 13:38:36.211+05:30	\N	66	\N	2026-02-04 13:38:45.077454+05:30	pending	\N	\N
130	2	Day Shift	MRPL	1.00	Reliance AM650	1.00	Reliance B650N	1.00	Reliance SRM100	1.00	Kansbec Red	0.00	750ml Cont(New)	2	1	2026-02-04 13:48:39.114+05:30	2026-02-04 13:48:56.1+05:30	\N	102	\N	2026-02-04 13:49:06.679043+05:30	pending	\N	\N
131	1	Day Shift	Reliance AM650	5.00	Reliance B650N	5.00	Reliance SRM100	5.00	None	0.00	Kansbec Red	0.50	1000ml Round Cont	2	5	2026-02-04 13:58:13.696+05:30	2026-02-04 13:58:44.244+05:30	\N	12	\N	2026-02-04 13:58:48.834973+05:30	pending	\N	\N
132	1	Day Shift	None	0.00	Reliance AM650	5.00	None	0.00	None	0.00	Kansbec Red	0.00	1000ml Round Cont	2	5	2026-02-04 14:03:39.773+05:30	2026-02-04 14:03:52.33+05:30	\N	6	\N	2026-02-04 14:03:55.956096+05:30	pending	\N	\N
133	1	Day Shift	Reliance AM650	1.00	None	0.00	Reliance AM650	11.00	None	0.00	Kansbec Red	0.00	1000ml Round Cont	2	5	2026-02-04 14:39:13.444+05:30	2026-02-04 14:45:08.708+05:30	\N	144	\N	2026-02-04 14:45:12.961565+05:30	pending	\N	\N
134	1	Day Shift	Reliance AM650	2.00	Reliance AM650	2.00	None	0.00	None	0.00	Natural	0.00	500ml Cont(New)	2	2	2026-02-04 14:49:23.071+05:30	2026-02-04 14:49:28.113+05:30	\N	134	\N	2026-02-04 14:49:30.714721+05:30	pending	\N	\N
135	2	Day Shift	Reliance B650N	1.00	Reliance SRM100	2.00	Reliance B650N	2.00	None	0.00	Kansbec Black	0.00	500ml Lid	6	2	2026-02-04 15:11:01.668+05:30	2026-02-04 15:11:10.582+05:30	\N	0	\N	2026-02-04 15:11:12.381638+05:30	pending	\N	\N
136	1	Day Shift	Reliance B650N	2.00	Reliance B650N	2.00	Reliance SRM100	2.00	None	0.00	Natural	0.00	500ml Cont(New)	2	2	2026-02-04 15:13:52.056+05:30	2026-02-04 16:03:26.07+05:30	\N	2988	\N	2026-02-04 16:03:28.775215+05:30	pending	\N	\N
137	1	Day Shift	Reliance AM650	3.00	Reliance AM650	3.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	5	2026-02-04 16:54:28.692+05:30	2026-02-04 16:54:36.136+05:30	\N	30	\N	2026-02-04 16:54:38.969577+05:30	pending	\N	\N
138	1	Day Shift	MRPL	2.00	Reliance B650N	2.00	None	0.00	None	0.00	Kansbec Black	2.00		1	4	2026-02-06 13:27:15.268+05:30	2026-02-06 13:27:21.524+05:30	\N	61	\N	2026-02-06 13:27:33.413891+05:30	pending	\N	\N
139	3	Day Shift	Reliance AM650	2.00	Reliance B650N	2.00	None	0.00	None	0.00	Natural	0.00	50ml Cup	6	1	\N	2026-02-06 13:33:45.433+05:30	\N	354	\N	2026-02-06 13:33:53.637075+05:30	pending	\N	\N
140	1	Day Shift	Reliance AM650	3.00	Reliance AM650	5.00	Reliance B650N	2.00	None	0.00	Kansbec Red	6.00		1	2	\N	2026-02-06 14:01:53.618+05:30	\N	374	\N	2026-02-06 14:01:59.125416+05:30	pending	\N	\N
141	2	Day Shift	Reliance AM650	5.00	Reliance AM650	5.00	None	0.00	None	0.00	Natural	0.00		1	5	\N	2026-02-06 14:43:52.389+05:30	\N	42	\N	2026-02-06 14:50:12.566676+05:30	pending	\N	\N
142	5	Day Shift	Reliance AM650	5.00	None	0.00	Reliance SRM100	5.00	None	0.00	Natural	0.00	500ml Lid	6	2	\N	2026-02-06 14:51:55.383+05:30	\N	216	\N	2026-02-06 14:52:02.39401+05:30	pending	\N	\N
143	1	Day Shift	Reliance AM650	1.00	Reliance B650N	1.00	None	0.00	None	0.00	Natural	0.00		1	2	2026-02-06 17:05:28.029+05:30	2026-02-06 17:05:37.294+05:30	\N	80	\N	2026-02-06 17:06:34.46291+05:30	pending	\N	\N
144	1	Day Shift	Reliance B650N	1.00	None	0.00	None	0.00	Reliance B650N	1.00	Kansbec White	1.00	1000ml Round Cont	1	1	2026-02-06 17:15:58.926+05:30	2026-02-06 17:16:06.901+05:30	\N	284	\N	2026-02-06 17:16:15.736184+05:30	pending	\N	\N
145	3	Day Shift	Reliance B650N	5.00	None	0.00	None	0.00	Reliance B650N	1.00	Natural	0.00	50ml Cup	6	1	2026-02-06 17:21:07.86+05:30	2026-02-06 17:21:33.926+05:30	\N	1128	\N	2026-02-06 17:21:39.720238+05:30	pending	\N	\N
146	1	Day Shift	Reliance AM650	2.00	Reliance B650N	2.00	None	0.00	Reliance AM650	1.00	Natural	0.00	1000ml Round Cont	1	1	2026-02-06 17:33:11.341+05:30	2026-02-06 17:33:19.152+05:30	\N	178	\N	2026-02-06 17:33:27.133783+05:30	pending	\N	\N
147	2	Day Shift	Reliance AM650	2.00	None	0.00	Reliance SRM100	2.00	None	0.00	Natural	0.00	1000ml Round Cont	1	2	2026-02-09 11:59:45.196+05:30	2026-02-09 12:05:51.606+05:30	\N	437	\N	2026-02-09 12:06:11.398571+05:30	pending	\N	\N
148	1	Day Shift	Reliance B650N	6.00	Reliance SRM100	6.00	None	0.00	None	0.00	Kansbec Red	0.50	1000ml Round Cont	1	1	2026-02-09 12:06:29.281+05:30	2026-02-09 12:14:53.439+05:30	\N	2286	\N	2026-02-09 12:14:59.131134+05:30	pending	\N	\N
149	1	Day Shift	None	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	1	1	2026-02-09 13:03:51.481+05:30	2026-02-09 14:46:10.154+05:30	\N	49006	\N	2026-02-09 14:46:14.933667+05:30	pending	\N	\N
150	2	Day Shift	Reliance SRM100	20.00	None	0.00	Reliance B650N	20.00	None	0.00	Natural	0.00	1000ml Round Cont	1	2	2026-02-09 14:57:50.628+05:30	2026-02-09 14:58:20.337+05:30	\N	5177	\N	2026-02-09 14:58:21.564231+05:30	pending	\N	\N
151	3	Day Shift	None	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	5	2026-02-09 15:00:11.934+05:30	2026-02-09 15:25:51.956+05:30	\N	614	\N	2026-02-09 15:25:52.705854+05:30	pending	\N	\N
152	1	Day Shift	Reliance AM650	2.00	None	0.00	Reliance AM650	2.00	None	0.00	Natural	0.00	1000ml Round Cont	1	1	2026-02-09 15:26:02.819+05:30	2026-02-09 15:47:25.862+05:30	\N	2809	\N	2026-02-09 15:47:28.188094+05:30	pending	\N	\N
153	1	Day Shift	None	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	1	5	2026-02-09 16:03:27.217+05:30	2026-02-09 16:21:09.216+05:30	\N	421	\N	2026-02-09 16:21:08.935508+05:30	pending	\N	\N
154	3	Day Shift	Reliance AM650	2.00	None	0.00	Reliance AM650	2.00	None	0.00	Natural	0.00	1000ml Round Cont	2	5	2026-02-09 16:11:25.177+05:30	2026-02-09 16:21:49.931+05:30	\N	698	\N	2026-02-09 16:21:50.159907+05:30	pending	\N	\N
155	3	Day Shift	None	0.00	None	0.00	Reliance B650N	2.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-09 16:22:39.436+05:30	2026-02-09 16:23:59.099+05:30	\N	246	\N	2026-02-09 16:23:59.802374+05:30	pending	\N	\N
156	1	Day Shift	None	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	5	2026-02-09 16:03:27.217+05:30	2026-02-09 17:00:03.259+05:30	\N	2	\N	2026-02-09 17:00:02.875407+05:30	pending	\N	\N
157	4	Day Shift	None	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	5	2026-02-09 16:22:01.546+05:30	2026-02-09 17:00:09.241+05:30	\N	4	\N	2026-02-09 17:00:08.896785+05:30	pending	\N	\N
158	1	Day Shift	Reliance SRM100	1.00	Reliance SRM100	1.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-09 17:01:22.032+05:30	2026-02-09 17:23:20.951+05:30	\N	13678	\N	2026-02-09 17:23:23.270674+05:30	pending	\N	\N
159	2	Day Shift	Reliance AM650	1.00	None	0.00	None	0.00	Reliance SRM100	1.00	Natural	0.00	\N	1	5	2026-02-09 17:00:19.31+05:30	2026-02-09 17:23:30.016+05:30	\N	1480	\N	2026-02-09 17:23:29.651839+05:30	pending	\N	\N
160	2	Day Shift	Reliance AM650	1.00	Reliance SRM100	1.00	None	0.00	None	0.00	Natural	0.00	\N	1	5	2026-02-09 17:24:15.142+05:30	2026-02-09 17:24:30.478+05:30	\N	14	\N	2026-02-09 17:24:30.220561+05:30	pending	\N	\N
161	1	Day Shift	Reliance B650N	1.00	Reliance B650N	1.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-09 17:24:48.742+05:30	2026-02-09 17:26:00.845+05:30	\N	582	\N	2026-02-09 17:26:03.042061+05:30	pending	\N	\N
162	1	Night Shift	Reliance AM650	1.00	Reliance SRM100	1.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-09 17:45:52.858+05:30	2026-02-09 17:46:47.341+05:30	\N	372	\N	2026-02-09 17:46:55.144121+05:30	pending	\N	\N
163	1	Day Shift	Reliance AM650	2.00	Reliance B650N	2.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-12 00:08:44.972+05:30	2026-02-12 00:08:52.105+05:30	\N	4	\N	2026-02-12 00:08:58.474979+05:30	pending	\N	\N
164	1	Day Shift	Reliance AM650	1.00	Reliance SRM100	2.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-12 00:23:02.44+05:30	2026-02-12 00:23:08.73+05:30	\N	4	\N	2026-02-12 00:23:10.329601+05:30	pending	\N	\N
165	1	Day Shift	Reliance B650N	1.00	Reliance SRM100	1.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-12 01:13:18.615+05:30	2026-02-12 01:13:49.087+05:30	\N	54	\N	2026-02-12 01:13:49.935162+05:30	pending	\N	\N
166	2	Day Shift	Reliance SRM100	5.00	Reliance SRM100	5.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	1	5	2026-02-12 01:14:32.884+05:30	2026-02-12 12:29:08.259+05:30	\N	1	\N	2026-02-12 12:29:16.635911+05:30	pending	\N	\N
167	1	Day Shift	Reliance AM650	1.00	Reliance B650N	1.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-12 12:29:25.033+05:30	2026-02-12 12:48:43.318+05:30	\N	14	\N	2026-02-12 12:48:50.296214+05:30	pending	\N	\N
168	1	Day Shift	Reliance AM650	11.00	Reliance B650N	1.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-12 13:02:48.565+05:30	2026-02-12 13:53:46.431+05:30	\N	764	\N	2026-02-12 13:53:57.546631+05:30	approved	\N	\N
169	1	Day Shift	MRPL	2.00	Reliance B650N	2.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-12 13:54:32.25+05:30	2026-02-12 14:05:53.011+05:30	\N	880	\N	2026-02-12 14:05:53.577758+05:30	pending	\N	\N
170	2	Day Shift	Reliance AM650	1.00	Reliance B650N	1.00	Reliance SRM100	1.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-12 12:50:04.399+05:30	2026-02-12 14:06:35.042+05:30	\N	1826	\N	2026-02-12 14:06:35.665818+05:30	pending	\N	\N
171	3	Day Shift	None	0.00	None	0.00	Reliance B650N	2.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-09 16:22:39.436+05:30	2026-02-12 14:06:40.605+05:30	\N	1838	\N	2026-02-12 14:06:41.641588+05:30	pending	\N	\N
172	4	Day Shift	None	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	5	2026-02-09 16:22:01.546+05:30	2026-02-12 14:06:46.649+05:30	\N	366	\N	2026-02-12 14:06:47.041192+05:30	pending	\N	\N
173	5	Day Shift	Reliance AM650	5.00	None	0.00	Reliance SRM100	5.00	None	0.00	Natural	0.00	500ml Lid	6	2	2026-02-12 13:21:08.964+05:30	2026-02-12 14:06:53.926+05:30	\N	2790	\N	2026-02-12 14:06:54.525701+05:30	pending	\N	\N
174	6	Day Shift	None	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00		1	5	2026-02-12 13:21:08.964+05:30	2026-02-12 14:08:07+05:30	\N	198	\N	2026-02-12 14:08:07.575696+05:30	pending	\N	\N
175	7	Day Shift	None	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00		1	5	2026-02-12 13:21:08.964+05:30	2026-02-12 14:08:14.091+05:30	\N	200	\N	2026-02-12 14:08:14.663699+05:30	pending	\N	\N
176	8	Night Shift	None	0.00	None	0.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	1	2	2026-02-12 13:21:08.964+05:30	2026-02-12 14:08:45.607+05:30	\N	510	\N	2026-02-12 14:08:46.851565+05:30	pending	\N	\N
177	1	Day Shift	Reliance B650N	1.00	Reliance SRM100	1.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-12 14:08:58.356+05:30	2026-02-12 14:18:15.88+05:30	\N	1074	\N	2026-02-12 14:21:29.500384+05:30	pending	\N	\N
178	7	Day Shift	Reliance SRM100	2.00	None	0.00	None	0.00	None	0.00	Natural	0.00	250ml Cont	4	5	2026-02-12 14:34:18.256+05:30	2026-02-12 15:45:04.339+05:30	\N	3380	\N	2026-02-12 15:45:07.069484+05:30	pending	\N	\N
179	1	Day Shift	MRPL	10.00	Reliance AM650	10.00	Reliance B650N	10.00	Reliance SRM100	10.00	Alak Blue	2.00	1000ml Round Cont	2	1	2026-02-12 14:25:25.636+05:30	2026-02-12 15:45:13.346+05:30	\N	10542	\N	2026-02-12 15:45:14.078781+05:30	pending	\N	\N
180	2	Day Shift	MRPL	5.00	Reliance B650N	6.00	Reliance AM650	7.00	None	0.00	Kansbec Black	5.00	500ml Cont(New)	2	1	2026-02-12 14:26:28.127+05:30	2026-02-12 15:45:43.119+05:30	\N	9470	\N	2026-02-12 15:45:45.437637+05:30	pending	\N	\N
181	3	Day Shift	Reliance AM650	6.00	Reliance B650N	6.00	Reliance SRM100	4.00	None	0.00	Natural	0.00	750ml Cont(New)	2	1	2026-02-12 14:26:59.519+05:30	2026-02-12 15:45:52.875+05:30	\N	9428	\N	2026-02-12 15:45:53.444127+05:30	pending	\N	\N
182	4	Day Shift	Reliance AM650	6.00	MRPL	6.00	Reliance SRM100	5.00	MRPL	10.00	Natural	0.00	500ml Cont(New)	2	5	2026-02-12 14:31:11.247+05:30	2026-02-12 15:45:59.843+05:30	\N	1782	\N	2026-02-12 15:46:00.910802+05:30	pending	\N	\N
183	5	Day Shift	Reliance AM650	3.00	MRPL	4.00	Reliance B650N	2.00	None	0.00	Kansbec Red	2.00	500ml Lid	6	2	2026-02-12 14:32:18.796+05:30	2026-02-12 15:48:47.124+05:30	\N	13722	\N	2026-02-12 15:48:47.290505+05:30	pending	\N	\N
184	6	Day Shift	Reliance AM650	2.00	MRPL	3.00	None	0.00	None	0.00	Natural	0.00		1	5	2026-02-12 14:33:12.39+05:30	2026-02-12 15:48:53.455+05:30	\N	904	\N	2026-02-12 15:48:54.321757+05:30	pending	\N	\N
185	1	Day Shift	Reliance B650N	22.00	Reliance B650N	2.00	None	0.00	None	0.00	Natural	0.00	1000ml Round Cont	2	1	2026-02-12 16:42:04.638+05:30	2026-02-12 17:38:46.525+05:30	\N	6738	Jsj	2026-02-12 17:38:50.591201+05:30	pending	\N	
186	1	Day Shift	Reliance AM650	1.00	None	0.00	None	0.00	None	0.00	Natural	0.00	500ml Lid	6	1	2026-02-12 17:39:06.99+05:30	2026-02-12 18:02:43.531+05:30	\N	8490	Response 	2026-02-12 18:02:47.038116+05:30	pending	\N	N/A
187	2	Day Shift	MRPL	1.00	Reliance B650N	1.00	None	0.00	None	0.00	Natural	0.00	50ml Cup	6	2	2026-02-12 18:02:28.746+05:30	2026-02-12 18:05:44.124+05:30	\N	960	Rtu	2026-02-12 18:05:56.779472+05:30	pending	\N	100ML Round WT COUNT
188	2	Day Shift	Reliance B650N	20.00	Reliance AM650	10.00	Reliance SRM100	5.00	None	0.00	Kansbec Red	0.50	100ml Cont	8	2	2026-02-12 18:38:05.701+05:30	2026-02-12 18:40:57.682+05:30	\N	1216	Hello head	2026-02-12 18:41:26.065327+05:30	pending	\N	100ML Round WT COUNT
189	2	Day Shift	Reliance B650N	2.00	Reliance SRM100	2.00	Reliance SRM100	2.00	None	0.00	Natural	0.00	100ml Cont	8	2	2026-02-12 18:52:45.273+05:30	2026-02-12 18:53:58.367+05:30	\N	152	Qwertyuucdffhvcddfggfddfcgvcgfff	2026-02-12 18:54:07.036957+05:30	pending	\N	100ML Round WT COUNT
190	1	Day Shift	Reliance AM650	1.00	Reliance B650N	1.00	Reliance SRM100	1.00	None	0.00	Natural	0.00	100ml Cont	8	1	2026-02-16 13:47:46.253+05:30	2026-02-16 13:48:39.393+05:30	\N	384	Gsjs	2026-02-16 13:48:48.512302+05:30	pending	\N	100ML Round BK
191	1	Day Shift	Reliance AM650	10.00	Reliance AM650	10.00	None	0.00	None	0.00	Natural	0.00	100ml Cont	8	8	2026-02-17 17:01:40.273+05:30	2026-02-17 17:49:27.552+05:30	\N	2856	Hello	2026-02-17 17:49:29.872188+05:30	pending	\N	100ML Round BK
192	1	Day Shift	Reliance B650N	20.00	Reliance SRM100	20.00	None	0.00	None	0.00	Natural	0.00	500ml Cont(Old)	2	8	2026-02-17 19:27:04.005+05:30	2026-02-17 19:29:45.645+05:30	\N	36	Hello 	2026-02-17 19:29:46.631851+05:30	pending	\N	100ML Round BK
193	1	Day Shift	Reliance SRM100	5.00	None	0.00	None	0.00	None	0.00	Natural	0.00	250ml Cont	4	2	2026-03-03 19:00:56.432+05:30	2026-03-03 19:01:00.42+05:30	\N	0	Gggg	2026-03-03 19:01:01.669441+05:30	pending	\N	250ML Round WT
194	2	Day Shift	None	0.00	None	0.00	None	0.00	Reliance B650N	1.00	Natural	0.00	250 Tumbler	4	2	2026-03-03 19:01:41.202+05:30	2026-03-03 19:01:43.942+05:30	\N	0	Hhh	2026-03-03 19:01:45.156138+05:30	pending	\N	250ML Round NAT
195	3	Day Shift	Reliance AM650	20.00	Reliance B650N	20.00	None	0.00	None	0.00	Natural	0.00	100ml Lid	8	1	2026-03-03 14:37:42.537+05:30	2026-03-03 19:01:50.055+05:30	\N	126776	Ghh	2026-03-03 19:01:51.173763+05:30	pending	\N	100ML Round NaT
196	4	Day Shift	Reliance B650N	5.00	Reliance AM650	5.00	Reliance SRM100	5.00	None	0.00	Natural	0.00	500ml Cont(New)	2	5	2026-03-03 14:38:18.961+05:30	2026-03-03 19:01:56.137+05:30	\N	6326	Hnj	2026-03-03 19:01:57.237535+05:30	pending	\N	500ML Round WT
197	1	Night Shift	Reliance AM650	10.00	Reliance B650N	10.00	None	0.00	None	0.00	Kansbec White	0.50	100ml Cont	8	2	2026-03-03 19:57:59.448+05:30	2026-03-03 20:03:57.488+05:30	\N	336	Completed 	2026-03-03 20:04:36.710167+05:30	pending	\N	100ML Round WT COUNT
198	1	Day Shift	Reliance AM650	2.00	Reliance AM650	2.00	None	0.00	None	0.00	Natural	0.00	100ml Cont	8	2	2026-03-03 20:05:40.366+05:30	2026-03-03 20:10:57.641+05:30	\N	1264	Fcgyh	2026-03-03 20:11:00.869244+05:30	pending	\N	100ML Round WT COUNT
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, role) FROM stdin;
1	op@factory.com	op123	OPERATOR
2	head@factory.com	head123	PRODUCTION HEAD
3	qa@factory.com	qa123	QUALITY
4	pack@factory.com	pack123	PACKING
5	admin@factory.com	admin123	ADMIN
\.


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 56, true);


--
-- Name: finished_goods_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.finished_goods_inventory_id_seq', 26, true);


--
-- Name: head_attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.head_attendance_id_seq', 18, true);


--
-- Name: hourly_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hourly_logs_id_seq', 72, true);


--
-- Name: inventory_colors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_colors_id_seq', 12, true);


--
-- Name: inventory_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_materials_id_seq', 8, true);


--
-- Name: inventory_molds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_molds_id_seq', 15, true);


--
-- Name: inventory_packing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_packing_id_seq', 1, false);


--
-- Name: machine_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.machine_status_id_seq', 4, true);


--
-- Name: production_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.production_logs_log_id_seq', 198, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: inventory_product finished_goods_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_product
    ADD CONSTRAINT finished_goods_inventory_pkey PRIMARY KEY (id);


--
-- Name: inventory_product finished_goods_inventory_product_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_product
    ADD CONSTRAINT finished_goods_inventory_product_name_key UNIQUE (product_name);


--
-- Name: head_attendance head_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.head_attendance
    ADD CONSTRAINT head_attendance_pkey PRIMARY KEY (id);


--
-- Name: hourly_logs hourly_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hourly_logs
    ADD CONSTRAINT hourly_logs_pkey PRIMARY KEY (id);


--
-- Name: inventory_colors inventory_colors_color_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_colors
    ADD CONSTRAINT inventory_colors_color_name_key UNIQUE (color_name);


--
-- Name: inventory_colors inventory_colors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_colors
    ADD CONSTRAINT inventory_colors_pkey PRIMARY KEY (id);


--
-- Name: inventory_materials inventory_materials_material_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_materials
    ADD CONSTRAINT inventory_materials_material_name_key UNIQUE (material_name);


--
-- Name: inventory_materials inventory_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_materials
    ADD CONSTRAINT inventory_materials_pkey PRIMARY KEY (id);


--
-- Name: inventory_molds inventory_molds_mold_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_molds
    ADD CONSTRAINT inventory_molds_mold_name_key UNIQUE (mold_name);


--
-- Name: inventory_molds inventory_molds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_molds
    ADD CONSTRAINT inventory_molds_pkey PRIMARY KEY (id);


--
-- Name: inventory_packing inventory_packing_item_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_packing
    ADD CONSTRAINT inventory_packing_item_name_key UNIQUE (item_name);


--
-- Name: inventory_packing inventory_packing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_packing
    ADD CONSTRAINT inventory_packing_pkey PRIMARY KEY (id);


--
-- Name: machine_status machine_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.machine_status
    ADD CONSTRAINT machine_status_pkey PRIMARY KEY (id);


--
-- Name: operators operators_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_pkey PRIMARY KEY (operator_id);


--
-- Name: production_logs production_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_logs
    ADD CONSTRAINT production_logs_pkey PRIMARY KEY (log_id);


--
-- Name: attendance unique_attendance; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT unique_attendance UNIQUE (staff_id, attendance_date);


--
-- Name: attendance unique_staff_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT unique_staff_date UNIQUE (staff_id, attendance_date);


--
-- Name: attendance unique_staff_date_pair; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT unique_staff_date_pair UNIQUE (staff_id, attendance_date);


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
-- Name: idx_attendance_date_shift; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_date_shift ON public.attendance USING btree (attendance_date, shift);


--
-- PostgreSQL database dump complete
--

\unrestrict 5C8DbTZpnB0pQjEUkb2RiuL1U8m60BRV8jr3qW1Yf4MT2C3zlZagYJ113XJuq7P

