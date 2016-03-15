import java.util.HashSet.*;

public class ws4jIndex {
	private HashSet index;

	private ws4jIndex(String filename) {
		build(filename);
	}



	public static ws4jIndex build(String filename) throws Exception {
		String line = null;

		try {
         	
         	BufferedReader br = new BufferedReader(filename);
	        
	        while ((line = br.readLine()) != null) {

	            System.out.println(line.split(" "));
	        }

	 	} catch(Exception e) {
	        e.printStackTrace();
	    }	
	}	

	public static void main(String[] args) {
		ws4jIndex index = new ws4jIndex("common_english_words.pos");
	}
}