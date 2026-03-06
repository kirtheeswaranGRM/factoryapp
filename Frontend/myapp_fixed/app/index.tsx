import { StyleSheet, Text, View } from "react-native";
import Login from "./login";


export default function index(){
  return(
<View style={style.container}>
  <Login/>
</View>
  )
}
const style= StyleSheet.create({
      container : {
        flex:1,
        alignItems : 'center' ,
        justifyContent : 'center',
        
      },
      head:{
        backgroundColor:"#1ef791ff",
        height:100,
        textAlign:"center",
        padding:40,
        width:500,
        borderRadius:5,


      }
     
    })


