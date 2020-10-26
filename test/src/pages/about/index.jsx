import Link from "../../../../src/Link.tsx";
import Head from "../../../../src/Head.ts"
import "../../style/main.css"
import Loader from "../../../../src/components/Loader.ts";
import LoadingBar from "../../components/LoadingBar/LoadingBar.jsx";

export default function App() {
    return (
        <div>
            <Head>
                <title>About</title>
                <meta name={"asd"}/>
            </Head>
            <Loader effect={React.useEffect}>
                <LoadingBar/>
            </Loader>
            <h1>This is the about pages</h1>
            <br/>
            <Link href={"/"}> 👻 Click Here To Go Home. Ha ha </Link>
        </div>
    )
}
